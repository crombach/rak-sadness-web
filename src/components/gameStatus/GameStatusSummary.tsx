import { ReactNode, useState } from "react";
import { GameStatus, HomeAway } from "../../types/ESPN";
import { GameSide, LeagueResult } from "../../types/LeagueResult";
import { GameSpread, WeekGame } from "../../types/WeekGame";
import getClasses from "../../utils/getClasses";
import marginAgainstSpread from "../../utils/scoring/marginAgainstSpread";
import "./GameStatusSummary.scss";

/** Regulation is four quarters, and anything past them is overtime. */
const REGULATION_PERIODS = 4;

/** Joins the two scores, which meet in the middle of the scoreline at every width. */
const SCORE_DASH = "–";

/**
 * What a game yet to kick off is doing, said in place of ESPN's own wording.
 *
 * ESPN says a scheduled game as its kickoff, in Eastern time. The strip under the
 * scoreline already says when the game starts, in the reader's own zone, so ESPN's
 * is the same fact twice and in the wrong zone for anyone outside the east.
 */
const PREGAME_DETAIL = "Pregame";

/** Points at the score of the side with the ball, from whichever side that is. */
const MARKER: Record<HomeAway, string> = {
  [HomeAway.HOME]: "◂",
  [HomeAway.AWAY]: "▸",
};

/**
 * What each side is called over its name.
 *
 * Neither side of a game played at neither of their grounds is hosting anybody, so
 * both are said to be a team and nothing more. ESPN names a home side for one of them
 * anyway, and the pool scores the line against it, but the label would be wrong.
 *
 * One word, where a label of two would wrap in the room a phone leaves beside a score
 * and take the name below it down a line.
 */
const SIDE_LABEL: Record<"hosted" | "neutral", Record<HomeAway, string>> = {
  hosted: { [HomeAway.AWAY]: "Away", [HomeAway.HOME]: "Home" },
  neutral: { [HomeAway.AWAY]: "Team", [HomeAway.HOME]: "Team" },
};

/**
 * Said in place of the down and distance while a game being played has none, which is
 * every ball that is not yet dead and every break in the game.
 *
 * A line either way, rather than one that comes and goes: the game is asked about again
 * every `POLL_MS`, and an answer with no down in it would otherwise take the line away
 * and move the scoreline under it.
 */
const NO_DOWN = "Between plays";

/** The pool's own line on the game, which is not always a bookmaker's. */
const SPREAD_LABEL = "Rak Madness Spread";

/** Said in its place for a game the picks put no line on. */
const NO_SPREAD = "None";

/**
 * How a game that finished level, or on its number, was scored. Both are a point for
 * everybody: the pool counts a tie as picking the winner, and a margin that lands on
 * the spread as covering it.
 */
const TIED = "Tied, both sides scored";
const PUSH = "Push, both sides scored";

/**
 * When the game starts, as its own parts.
 *
 * Split rather than joined, because the stylesheet is what puts a dot between two
 * parts. Written into the strings instead, the dots inside a half would be spaced one
 * way and the dot between the halves another.
 *
 * Both parts are read off the one instant in whatever zone the reader is in, so a
 * late kickoff falls on the day it falls on for them. The zone is named because this
 * is now the only time the dialog shows, and a bare `1:00 PM` beside a game played
 * three zones away reads as ambiguous.
 */
function kickoffParts(date: Date): Array<string> {
  return [
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }),
  ];
}

function venueParts(result: LeagueResult): Array<string> | undefined {
  const { venue } = result;
  if (venue == null) return undefined;
  const place = [venue.city, venue.state].filter((it) => it != null).join(", ");
  return place !== "" ? [venue.name, place] : [venue.name];
}

/** One half of the strip under the scoreline, its parts dotted apart. */
function MetaGroup({ parts }: { parts: Array<string> }) {
  return (
    <span className="game-status__meta-group">
      {parts.map((part) => (
        <span key={part}>{part}</span>
      ))}
    </span>
  );
}

/** `OT` for the first period past regulation, `2OT` for the next, and so on. */
function overtimeLabel(period: number): string {
  const overtime = period - REGULATION_PERIODS;
  return overtime === 1 ? "OT" : `${overtime}OT`;
}

/** How many periods the game has scores for, overtime included. */
function periodsPlayed(result: LeagueResult): number {
  return Math.max(result.away.linescores.length, result.home.linescores.length);
}

/**
 * How the game stands, in the few characters the column between two scores holds.
 *
 * ESPN's own wording runs to `8:42 - 3rd Quarter`, which wraps to three lines there.
 * Said as `Q3 8:42` it fits on one, on a phone and on a desktop alike.
 */
function detailText(result: LeagueResult): string {
  if (result.status === GameStatus.FINAL) {
    return periodsPlayed(result) > REGULATION_PERIODS ? "FT/OT" : "FT";
  }
  if (result.status === GameStatus.UPCOMING) {
    return PREGAME_DETAIL;
  }
  // Postponed, delayed, canceled: a stage the app has no short form for, so ESPN's
  // own word for it stands. Its wording of those carries no kickoff to repeat.
  if (result.status !== GameStatus.LIVE || result.period == null) {
    return result.detailMessage;
  }
  const period =
    result.period <= REGULATION_PERIODS
      ? `Q${result.period}`
      : overtimeLabel(result.period);
  // A clock reading zero is a period that has ended rather than one being played, and
  // saying so adds nothing to the period itself.
  return result.clock != null && !result.clock.startsWith("0:00")
    ? `${period} ${result.clock}`
    : period;
}

/** The other team in the game, which the line is only ever written against one of. */
function opponentOf(result: LeagueResult, team: string): string {
  return (
    [result.home, result.away]
      .map((side) => side.team.abbreviation)
      .find((abbreviation) => abbreviation !== team) ?? team
  );
}

/** How a side finished, where the game is over and the two did not finish level. */
type SideOutcome = "scored" | "missed";

/**
 * Which side a player had to pick to score the point, or nobody where everybody did.
 *
 * Against the line where the picks carried one, since that is what the week is scored
 * on, and on the game itself where they did not. Nobody on a tie or a push, which the
 * pool scores for everybody either way.
 *
 * The same question `getPickResults` asks of a player's own pick, over the same
 * `marginAgainstSpread`, read from the favored side rather than the picked one.
 */
function scoringTeam(
  result: LeagueResult,
  spread?: GameSpread,
): string | undefined {
  if (spread == null) {
    return result.winner.team?.abbreviation;
  }
  // Read from the favored side, which is the side `weekGames` writes the line from.
  const margin = marginAgainstSpread(result, spread.team, spread.points);
  if (margin === 0) {
    return undefined;
  }
  return margin > 0 ? spread.team : opponentOf(result, spread.team);
}

/**
 * What the pool made of the game, said once it is over.
 *
 * Against the spread where the picks carried one, since that is what the week is
 * scored on, and on the game itself where they did not.
 */
function outcomeText(result: LeagueResult, spread?: GameSpread): string {
  const scored = scoringTeam(result, spread);
  if (spread == null) {
    return scored != null ? `${scored} won` : TIED;
  }
  // Past tense, like `won` above it and the two lines below. The game is over by the
  // time any of them is said.
  return scored != null ? `${scored} covered` : PUSH;
}

/**
 * Whether a score is written with a leading zero, which is where it is in single
 * figures and the other side is not.
 *
 * The pair reads as one number either side of the dash, and a lone digit beside a
 * two-digit number reads as the smaller of the two by its width before it is read at
 * all. Both sides in single figures are left alone: there is nothing to line up with.
 */
function isPadded(score: number, opponentScore: number): boolean {
  return score < 10 && opponentScore >= 10;
}

/** Where the game is up to, over the scores. */
function Detail({ result }: { result: LeagueResult }) {
  return <p className="game-status__detail">{detailText(result)}</p>;
}

/**
 * Under the scores: what the offense is facing while the game is being played, and
 * what the pool made of it once the game is over.
 *
 * Who has the ball is left to the marker beside their score.
 */
function Note({
  result,
  spread,
}: {
  result: LeagueResult;
  spread?: GameSpread;
}) {
  if (result.status === GameStatus.FINAL) {
    return (
      <p className="game-status__outcome">{outcomeText(result, spread)}</p>
    );
  }
  const { downDistanceText } = result.possession;
  if (downDistanceText == null && result.status !== GameStatus.LIVE) {
    return null;
  }
  return <p className="game-status__down">{downDistanceText ?? NO_DOWN}</p>;
}

/**
 * Which side has the ball, pointed at their score.
 *
 * Both sides wear one whatever the game is doing, and every side without the ball
 * wears an invisible one. It holds the room the visible one takes, so neither the ball
 * changing hands, nor a poll that finds nobody with it, nor a game ending moves the
 * scores.
 */
function Marker({
  homeAway,
  hasBall,
}: {
  homeAway: HomeAway;
  hasBall: boolean;
}) {
  return hasBall ? (
    <span className="game-status__marker" aria-label="Has the ball">
      {MARKER[homeAway]}
    </span>
  ) : (
    <span aria-hidden="true" className="game-status__marker --blank">
      {MARKER[homeAway]}
    </span>
  );
}

function Score({
  side,
  opponent,
  homeAway,
  hasBall,
  outcome,
}: {
  side: GameSide;
  /** The other side, which is what says whether this number is padded. */
  opponent: GameSide;
  homeAway: HomeAway;
  hasBall: boolean;
  outcome?: SideOutcome;
}) {
  const padded = isPadded(side.score, opponent.score);
  return (
    <p
      className={getClasses("game-status__score", `--${homeAway}`, {
        "--scored": outcome === "scored",
        "--missed": outcome === "missed",
      })}
    >
      {/* Held apart from the marker beside it so the wireframe can draw a bar over
          the number alone, and so a number of one digit takes the room two do. */}
      <span
        className="game-status__points"
        // A padded number is read out as two of them, so the score itself is what
        // is announced instead.
        aria-label={padded ? `${side.score}` : undefined}
      >
        {padded ? `0${side.score}` : side.score}
      </span>
      <Marker homeAway={homeAway} hasBall={hasBall} />
    </p>
  );
}

/**
 * The two scores and, stacked either side of them, where the game is up to and what
 * either the offense or the pool has to say about it.
 *
 * One block rather than three bands across the scoreline, so both lines are read
 * against the numbers they belong to instead of against the dialog's edges.
 */
function Center({
  result,
  spread,
  outcomeOf,
}: {
  result: LeagueResult;
  spread?: GameSpread;
  /** How a side finished, which is nothing until the game is over. */
  outcomeOf: (side: GameSide) => SideOutcome | undefined;
}) {
  // Who has the ball is nobody's before kickoff, and a marker left on the winner
  // reads as a game still going.
  const hasBall = (side: HomeAway) =>
    result.status === GameStatus.LIVE && result.possession.homeAway === side;
  return (
    <div className="game-status__center">
      <Detail result={result} />
      <div className="game-status__scores">
        <Score
          side={result.away}
          opponent={result.home}
          homeAway={HomeAway.AWAY}
          hasBall={hasBall(HomeAway.AWAY)}
          outcome={outcomeOf(result.away)}
        />
        <span aria-hidden="true" className="game-status__dash">
          {SCORE_DASH}
        </span>
        <Score
          side={result.home}
          opponent={result.away}
          homeAway={HomeAway.HOME}
          hasBall={hasBall(HomeAway.HOME)}
          outcome={outcomeOf(result.home)}
        />
      </div>
      <Note result={result} spread={spread} />
    </div>
  );
}

/**
 * A team's name in full, where it plays over what it is called there.
 *
 * Two lines rather than one, since that is how a name of four words reads as one
 * thing. ESPN sends both halves for every team in either league, and a team it sent
 * only the whole name for takes the one line it can be split no further than.
 */
function TeamName({ team }: { team: GameSide["team"] }) {
  if (team.location == null || team.mascot == null) {
    return team.name;
  }
  return (
    <>
      <span className="game-status__name-place">{team.location}</span>
      <span className="game-status__name-mascot">{team.mascot}</span>
    </>
  );
}

/** A side's mark and text. Its score is in the block between the two sides. */
function Side({
  side,
  homeAway,
  isNeutralSite,
  logo,
  outcome,
}: {
  side: GameSide;
  homeAway: HomeAway;
  /** Says the sides by where they stand instead of by whose ground it is. */
  isNeutralSite: boolean;
  /** Left out where either side has no mark to draw, so neither draws one. */
  logo?: ReactNode;
  outcome?: SideOutcome;
}) {
  return (
    <div className={`game-status__side --${homeAway}`}>
      {logo}
      <div className="game-status__team">
        <span className="game-status__side-label">
          {SIDE_LABEL[isNeutralSite ? "neutral" : "hosted"][homeAway]}
        </span>
        <span
          className={getClasses("game-status__team-name", {
            "--scored": outcome === "scored",
            "--missed": outcome === "missed",
          })}
        >
          {/* The abbreviation on a phone and the name once there is width for it.
              Both are in the page, so neither costs a measurement to choose
              between, and the one read out is the name however narrow the screen. */}
          <span className="game-status__name-full">
            <TeamName team={side.team} />
          </span>
          <span aria-hidden="true" className="game-status__name-short">
            {side.team.abbreviation}
          </span>
        </span>
        {side.record != null && (
          <span className="game-status__record">{side.record}</span>
        )}
      </div>
    </div>
  );
}

/** Both marks or neither: one side wearing a logo and the other nothing reads as the
 *  app having lost track of a team. */
function hasLogos(result: LeagueResult): boolean {
  return result.home.team.logoUrl != null && result.away.team.logoUrl != null;
}

/**
 * The game, laid out the same way whether it is the one just fetched or the week's own
 * copy of it standing in under a wireframe.
 *
 * One layout for both is what keeps a wait the size of the answer: a game the week had
 * live carries a down and a link out, one it had finished carries neither, and the
 * wireframe is built from the same branches rather than from a guess at them.
 */
function Game({
  result,
  spread,
  logo,
}: {
  result: LeagueResult;
  spread?: GameSpread;
  /** What a side wears beside its name, or nothing where the marks are dropped. */
  logo?: (side: GameSide) => ReactNode;
}) {
  const venue = venueParts(result);
  // Only once the game is over, which is when the sentence under the scores says the
  // same thing. A side ahead at half time has won nothing yet.
  const isOver = result.status === GameStatus.FINAL;
  const scored = isOver ? scoringTeam(result, spread) : undefined;
  // Both sides where the game is over and nobody scored, which is a push or a tie
  // with no line to push against. The pool gives everybody the point there, so
  // whichever side a pick was on, it was on a side that scored.
  const outcomeOf = (side: GameSide): SideOutcome | undefined => {
    if (!isOver) return undefined;
    if (scored == null) return "scored";
    return side.team.abbreviation === scored ? "scored" : "missed";
  };
  return (
    <>
      <p className="game-status__spread">
        {SPREAD_LABEL}:{" "}
        {spread != null ? `${spread.team} ${spread.points}` : NO_SPREAD}
      </p>
      <div className="game-status__scoreline">
        <Side
          side={result.away}
          homeAway={HomeAway.AWAY}
          isNeutralSite={result.isNeutralSite}
          logo={logo?.(result.away)}
          outcome={outcomeOf(result.away)}
        />
        <Center result={result} spread={spread} outcomeOf={outcomeOf} />
        <Side
          side={result.home}
          homeAway={HomeAway.HOME}
          isNeutralSite={result.isNeutralSite}
          logo={logo?.(result.home)}
          outcome={outcomeOf(result.home)}
        />
      </div>
      {/* Under the scoreline rather than over it: the game is what the dialog was
          opened for, and when and where it is played is the footnote. */}
      <div className="game-status__meta">
        <MetaGroup parts={kickoffParts(result.date)} />
        {venue != null && <MetaGroup parts={venue} />}
      </div>
    </>
  );
}

/**
 * The game before it has been fetched, drawn from the week's own copy of it.
 *
 * The same layout as the answer, with every word left in place and taken down to a bar
 * over it, so the wait is the size the answer will be: the same lines, in the same
 * rows, at the same widths, down to a name that takes two lines and a venue that takes
 * its own. Nothing under the dialog moves when the answer lands. What is on the way is
 * the same game, so the only thing the week's copy of it can be wrong about is a score
 * or a clock.
 *
 * Crossed by the one sheen the tables' wireframe uses, so a wait looks the same
 * wherever the app is waiting.
 */
function Wireframe({
  result,
  spread,
}: {
  result: LeagueResult;
  spread?: GameSpread;
}) {
  return (
    <>
      {/* Nothing below is worth reading out, so this says what it stands in for. */}
      <span className="game-status__sr-only" role="status">
        Loading the game
      </span>
      <div aria-hidden="true" className="game-status --skeleton">
        <Game
          result={result}
          spread={spread}
          // A block of its own rather than the mark itself: an image cannot carry the
          // bar the rest of the wireframe is drawn with, and the real one is not
          // fetched for a game nobody is looking at yet.
          logo={
            hasLogos(result)
              ? () => <span className="game-status__logo" />
              : undefined
          }
        />
      </div>
    </>
  );
}

/**
 * A game the way ESPN's own boxscore says it: each side out on its own edge, the two
 * scores meeting at a dash between them, with where the game is up to over those scores
 * and what the offense or the pool has to say under them.
 *
 * `result` is the game as it was last fetched, and `isLoading` says it is not yet the
 * game `game` names. A wireframe stands in until it is, so a live game is never shown
 * at the score the week was last worked out at, nor at another game's.
 */
export default function GameStatusSummary({
  game,
  result,
  isLoading = false,
}: {
  game?: WeekGame;
  result?: LeagueResult;
  /** Set while the chosen game is being fetched for the first time. */
  isLoading?: boolean;
}) {
  // Which game's marks failed to load, rather than a flag, so moving to another
  // game asks about its marks instead of inheriting a verdict on the last one's.
  const [logolessId, setLogolessId] = useState<string>();

  if (game == null) {
    return null;
  }
  if (game.result == null) {
    return (
      <p className="game-status__missing">
        No game was found for {game.label}. The picks name {game.name}, which
        ESPN does not list this week.
      </p>
    );
  }
  // The wireframe rather than the game before it, so what is on screen is always the
  // game the search names.
  if (isLoading || result == null) {
    return <Wireframe result={game.result} spread={game.spread} />;
  }

  const logos = hasLogos(result) && logolessId !== result.id;

  return (
    <div className="game-status">
      <Game
        result={result}
        spread={game.spread}
        logo={
          logos
            ? (side) => (
                <img
                  className="game-status__logo"
                  src={side.team.logoUrl}
                  // The team's name is beside it, so the mark says nothing a reader
                  // of the page in words is missing.
                  alt=""
                  onError={() => setLogolessId(result.id)}
                />
              )
            : undefined
        }
      />
    </div>
  );
}
