#!/usr/bin/env python3
"""PreToolUse hook: hold `git commit`, `gh pr create`, and `gh pr edit` to the repo's
commit and PR conventions. Runs inside Claude Code, so human contributors are
untouched.

Checks, all mechanical:
  - a commit subject and a PR title are held to one format, a Conventional Commit
  - either opens its summary with the branch's ticket key in brackets, when the
    branch names one
  - a PR body passed with --body/--body-file was built from the PR template,
    with no leftover guidance comments and no empty sections
  - the body links the ticket its branch names, when the template asks for it
  - the punctuation the template bans stays out of the body
  - the body stays inside the word budget the template states

Fails open everywhere: an unreadable subject or body (editor commits, `-F -`,
unbalanced quotes, a missing template) is allowed through. What it can read it
enforces, with no opt-out flag or environment variable. Don't add one.
"""
import json
import os
import re
import shlex
import sys

TYPES = ("build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor",
         "revert", "style", "test")
# The one header spec, worded exactly as the template, the workflow, and the
# commit-and-pr skill word it. A commit subject and a PR title are the same string.
HEADER_SPEC = "<type>(<scope>)?!?: [<issue>]? <imperative summary>"
# The skill holding the full conventions. A deny is the moment an agent needs it,
# and naming it here is what makes a lazily-loaded skill reliable.
SKILL_NAME = "commit-and-pr"
# The bracketed ID lives in the summary, which is free text, so this grammar check
# is the workflow's pattern with Python's space class in place of [:space:].
HEADER_PATTERN = re.compile(
    r"^(%s)(\([^()\s]+\))?!?: .+" % "|".join(TYPES), re.IGNORECASE)
# The bracketed ticket ID opening the summary: `feat(auth): [YCOM-21] add login`.
ISSUE_PATTERN = re.compile(r"^[a-z]+(?:\([^()\s]+\))?!?: \[([^\]\s]+)\]",
                           re.IGNORECASE)

TEMPLATE = os.path.join(".github", "pull_request_template.md")
# The template says so in its own comments; the hook only enforces what it finds.
PUNCTUATION_RULE = "No em-dashes, no semicolons"
# The branch's key is the one ticket a hook can find. Any other ticket the work
# belongs to is the agent's to link, which is why the skill states the rule too.
TICKET_RULE = "Link every ticket"
BANNED = {"—": "em-dash", "–": "en-dash", ";": "semicolon"}
# The budget comes off the template too, so a repo that never states one, or states
# its own, is judged by its own words and never by a number hardcoded here.
WORD_RULE = re.compile(r"under (\d+) words", re.IGNORECASE)
TABLE_ROW = re.compile(r"^\s*\|")
CHECKLIST_ITEM = re.compile(r"^\s*[-*+]\s+\[[ xX]\]")
# Embedded media is markup and a URL, not prose, and either can run hundreds of
# characters, so counting it would decide the budget for the body around it.
MEDIA_EXT = r"png|jpe?g|gif|webp|svg|apng|avif|bmp|mp4|mov|webm|m4v"
MEDIA_TARGET = r"(?:\.(?:%s)\b|user-attachments/assets/)" % MEDIA_EXT
MEDIA = re.compile(
    r"!\[[^\]]*\]\([^)]*\)"                               # ![alt](src)
    r"|\[[^\]]*\]\([^)]*%s[^)]*\)" % MEDIA_TARGET +       # [text](screenshot.png)
    r"|<\s*/?\s*(?:img|video|source|picture|figure|figcaption)\b[^>]*>",
    re.IGNORECASE)
MEDIA_TOKEN = re.compile(r"^<?\S*%s\S*>?$" % MEDIA_TARGET, re.IGNORECASE)

SEPARATORS = ("&&", "||", ";", "|", "&", "\n")
WRAPPERS = ("timeout", "time", "nice", "nohup", "stdbuf", "command", "builtin",
            "noglob", "xargs", "env")
ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
# -m, and any short-flag cluster ending in it: -am, -sm, -am"subject".
SHORT_MESSAGE = re.compile(r"^-[A-Za-z]*m(.*)$")
GIT_OPTS_WITH_VALUE = ("-C", "-c", "--git-dir", "--work-tree", "--namespace",
                       "--exec-path")
# A key as the tracker writes it, uppercase, ending at its digits: `YCOM-21-login`
# and `feature/ENG-4_x` name a ticket, `release-1` and `fix-2fa-login` do not. A
# lowercase branch reads as no ticket, which fails open rather than deny wrongly.
TICKET_IN_BRANCH = re.compile(
    r"(?:^|[^A-Za-z0-9])([A-Z][A-Z0-9]{1,9}-\d+)(?![A-Za-z0-9])")
CODE_SPANS = re.compile(r"```.*?```|`[^`]*`", re.DOTALL)
FENCE = re.compile(r"(?ms)^```.*?^```")
COMMENTS = re.compile(r"<!--.*?-->", re.DOTALL)


def segments(tokens):
    """The compound command's parts, split on shell separators."""
    part, out = [], []
    for token in tokens:
        if token in SEPARATORS:
            out.append(part)
            part = []
        else:
            part.append(token)
    out.append(part)
    return [p for p in out if p]


def strip_prefix(tokens):
    """Drop leading env assignments and wrappers to reach the real command."""
    while tokens and (ASSIGNMENT.match(tokens[0]) or tokens[0] in WRAPPERS):
        tokens = tokens[1:]
    return tokens


def subcommand_args(tokens, program, words):
    """Arguments after `<program> [options] <words...>`, else None."""
    if not tokens or tokens[0] != program:
        return None
    index = 1
    for word in words:
        while index < len(tokens):
            token = tokens[index]
            if token == word:
                index += 1
                break
            if program == "git" and token in GIT_OPTS_WITH_VALUE:
                index += 2
                continue
            if token.startswith("-"):
                index += 1
                continue
            return None                  # some other subcommand
        else:
            return None
    return tokens[index:]


def option(args, *names):
    """The value of the first of `names` present in args, else None."""
    for index, token in enumerate(args):
        if token in names and index + 1 < len(args):
            return args[index + 1]
        for name in names:
            if token.startswith(name + "="):
                return token.split("=", 1)[1]
    return None


def commit_subjects(args):
    """Subjects a `git commit` invocation would write."""
    messages, index = [], 0
    while index < len(args):
        token = args[index]
        short = SHORT_MESSAGE.match(token)
        if token == "--message" and index + 1 < len(args):
            messages.append(args[index + 1])
            index += 2
            continue
        if token.startswith("--message="):
            messages.append(token.split("=", 1)[1])
        elif short and short.group(1):
            messages.append(short.group(1))
        elif short and index + 1 < len(args):
            messages.append(args[index + 1])
            index += 2
            continue
        index += 1
    # First -m is the subject; the rest are body paragraphs.
    return messages[:1]


def prose(body):
    """The body minus code spans and HTML comments, for punctuation checks."""
    return COMMENTS.sub("", CODE_SPANS.sub("", body))


def headings(text):
    return set(re.findall(r"(?m)^#{2,3}\s+(.+?)\s*$", text))


def prose_words(body):
    """Words a reviewer reads. A fenced block, a table, a checklist and an embedded
    image or video are not prose, so none of them counts against the budget."""
    text = MEDIA.sub("", COMMENTS.sub("", FENCE.sub("", body)))
    kept, skipping_item = [], False
    for line in text.splitlines():
        if TABLE_ROW.match(line):
            continue
        if CHECKLIST_ITEM.match(line):
            skipping_item = True
            continue
        if skipping_item:
            # A checklist item wraps onto indented continuation lines.
            if line[:1] in (" ", "\t") and line.strip():
                continue
            skipping_item = False
        kept.append(line)
    return len([word for word in " ".join(kept).split()
                if not MEDIA_TOKEN.match(word)])


def empty_sections(body):
    """Headings with nothing under them."""
    parts = re.split(r"(?m)^(#{2,3}\s+.+?)\s*$", body)
    empty = []
    for index in range(1, len(parts) - 1, 2):
        if not parts[index + 1].strip():
            empty.append(parts[index].lstrip("# ").strip())
    return empty


def read_file(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as handle:
            return handle.read()
    except OSError:
        return ""


def body_problems(body, template, branch=""):
    """Everything wrong with a PR body, given the repo's template."""
    problems = []
    ticket = TICKET_IN_BRANCH.search(branch or "")
    if TICKET_RULE in template and ticket:
        key = ticket.group(1)
        if key.lower() not in body.lower():
            problems.append("branch %s names ticket %s, so the body links it. Link "
                            "every other ticket this work belongs to too" % (branch, key))
    wanted = headings(template)
    if wanted and not (headings(body) & wanted):
        problems.append(
            "the body does not use %s. --body and --body-file skip GitHub's "
            "prefill, so build the body from that file. Sections: %s"
            % (TEMPLATE, ", ".join(sorted(wanted))))
    if COMMENTS.search(body):
        problems.append("the body still has the template's guidance comments in it. "
                        "Write over each one, don't keep it")
    empty = empty_sections(body)
    if empty:
        problems.append("empty sections, fill or delete: %s" % ", ".join(empty))
    budget = WORD_RULE.search(template)
    if budget:
        limit = int(budget.group(1))
        words = prose_words(body)
        if words > limit:
            problems.append(
                "the body is %d words, the budget is %d. Cut what the reviewer "
                "gets from the diff or the ticket: a retelling of the ticket, "
                "history, counts, a per-file walkthrough, self-assessment"
                % (words, limit))
    if PUNCTUATION_RULE in template:
        found = sorted({name for mark, name in BANNED.items()
                        if mark in prose(body)})
        if found:
            problems.append("%s in the body. %s: short sentences instead"
                            % (", ".join(found), PUNCTUATION_RULE.lower()))
    return problems


def header_problems(header, branch):
    """A commit subject and a PR title are held to the same format."""
    problems = []
    if not HEADER_PATTERN.match(header):
        return ["%r does not match %s. Types: %s. Scope: the module changed, "
                "in parentheses: (api)"
                % (header, HEADER_SPEC, ", ".join(TYPES))]
    ticket = TICKET_IN_BRANCH.search(branch or "")
    if ticket:
        key = ticket.group(1)
        issue = ISSUE_PATTERN.match(header)
        if not issue or issue.group(1).lower() != key.lower():
            problems.append(
                "branch %s names ticket %s, so the summary opens with it: "
                "<type>: [%s] ..." % (branch, key, key))
    return problems


def git_head_path(cwd):
    """`HEAD`, following the pointer a worktree or submodule leaves behind.

    In those, `.git` is a file holding `gitdir: <path>` rather than a directory,
    so reading `.git/HEAD` finds nothing and the branch reads as unknown. That
    fails open, silently skipping the ticket-key check for every agent working in
    a worktree.
    """
    dot_git = os.path.join(cwd or ".", ".git")
    if not os.path.isfile(dot_git):
        return os.path.join(dot_git, "HEAD")
    pointer = read_file(dot_git).strip()
    if not pointer.startswith("gitdir:"):
        return os.path.join(dot_git, "HEAD")
    target = pointer.partition(":")[2].strip()
    if not os.path.isabs(target):
        target = os.path.join(cwd or ".", target)
    return os.path.join(target, "HEAD")


def branch_name(cwd):
    head = read_file(git_head_path(cwd))
    return head.strip().rpartition("/")[2] if "ref:" in head else ""


def problems_for(command, cwd):
    """Every convention problem in this command, in report order."""
    if "commit" not in command and "pr" not in command:
        return []                        # cheap exit before any parsing
    try:
        tokens = shlex.split(command, comments=False)
    except ValueError:
        return []

    branch = branch_name(cwd)
    found = []
    for part in segments(tokens):
        part = strip_prefix(part)
        args = subcommand_args(part, "git", ["commit"])
        if args is not None:
            found += ["Commit subject: " + p for subject in commit_subjects(args)
                      for p in header_problems(subject, branch)]
            continue
        for verb in ("create", "edit"):
            args = subcommand_args(part, "gh", ["pr", verb])
            if args is None:
                continue
            title = option(args, "-t", "--title")
            if title:
                found += ["PR title: " + p for p in header_problems(title, branch)]
            body = option(args, "-b", "--body")
            body_file = option(args, "-F", "--body-file")
            if body_file and body_file != "-":
                body = read_file(os.path.join(cwd or ".", body_file))
            if body:
                template = read_file(os.path.join(cwd or ".", TEMPLATE))
                found += ["PR body: " + p
                          for p in body_problems(body, template, branch)]
    return found


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0
    if payload.get("tool_name") != "Bash":
        return 0
    command = (payload.get("tool_input") or {}).get("command") or ""
    problems = problems_for(command, payload.get("cwd"))
    if problems:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": "\n".join(
                ["Repo conventions (full rules: the `%s` skill):" % SKILL_NAME]
                + ["  - " + p for p in problems]
                + ["Fix and retry. No bypass."])}}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
