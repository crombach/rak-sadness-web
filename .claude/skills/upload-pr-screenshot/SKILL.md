---
name: upload-pr-screenshot
description: Host a screenshot or recording (from record-demo or elsewhere) on the pr-assets branch and get back the raw URL to embed it in a PR body. Use whenever a PR body should show a before/after image or a demo, since gh has no other way to attach one.
---

# Upload a PR screenshot

```bash
bash .claude/skills/upload-pr-screenshot/scripts/upload_pr_screenshot.sh \
  --feature <name> <file> [<file> ...]
```

Prints one `https://raw.githubusercontent.com/...` URL per file. Use one of
those in the PR body: `![before](<url>)`.

`--feature` should read like a slug for what the PR is about, not the git
branch name character for character: readable in a URL, and stable if the
branch gets renamed. Reuse the same `--feature` for every image in one PR,
and reuse it again on a later commit to that PR instead of inventing a new
name, so a repeat run lands in the same directory rather than scattering it.

Never commit an image to the feature branch itself. pr-assets exists so a
PR's diff stays code only.
