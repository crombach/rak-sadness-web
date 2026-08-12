import { useState } from "react";
import { GameStatus, HomeAway } from "../../types/ESPN";
import { GameSide, LeagueResult } from "../../types/LeagueResult";
import { WeekGame } from "../../types/WeekGame";
import "./GameStatusSummary.scss";

/** Regulation is four quarters, and anything past them is overtime. */
const REGULATION_PERIODS = 4;

/** Joins the two scores, which meet in the middle of the scoreline at every width. */
const SCORE_DASH = "–";

/**
 * What a game yet to kick off is doing, said in place of ESPN's own wording.
 *
 * ESPN says a scheduled game as its kickoff, in Eastern time. The strip above the
 * scoreline already says when the game starts, in the reader's own zone, so ESPN's
 * is the same fact twice and in the wrong zone for anyone outside the east.
 */
const PREGAME_DETAIL = "Pregame";

/** Points at the score of the side with the ball, from whichever side that is. */
const MARKER: Record<HomeAway, string> = {
  [HomeAway.HOME]: "▸",
  [HomeAway.AWAY]: "◂",
};

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

/** One half of the strip above the scoreline, its parts dotted apart. */
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

/**
 * Where the game is up to, over the scores.
 *
 * No points by quarter: the pool is scored on the game's own result, so a quarter's
 * points are of no use to anyone reading this.
 */
function Detail({ result }: { result: LeagueResult }) {
  return <p className="game-status__detail">{detailText(result)}</p>;
}

/**
 * Said in place of the down and distance while a game being played has none, which is
 * every ball that is not yet dead and every break in the game.
 *
 * A line either way, rather than one that comes and goes: the game is asked about again
 * every `POLL_MS`, and an answer with no down in it would otherwise take the line away
 * and move the scoreline under it.
 */
const NO_DOWN = "Between plays";

/** What the link out to ESPN's own tracker for the game is called. */
const GAMECAST_LABEL = "ESPN Gamecast";

/**
 * What the offense is facing, under the scores. Who has the ball is left to the
 * marker beside their score.
 */
function Down({ result }: { result: LeagueResult }) {
  const { downDistanceText } = result.possession;
  if (downDistanceText == null && result.status !== GameStatus.LIVE) {
    return null;
  }
  return <p className="game-status__down">{downDistanceText ?? NO_DOWN}</p>;
}

/**
 * Which side has the ball, pointed at their score.
 *
 * Both sides wear one while the game is being played, and the side without the ball
 * wears an invisible one, so neither the ball changing hands nor a poll that finds
 * nobody with it moves the scores.
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
  homeAway,
  hasBall,
}: {
  side: GameSide;
  homeAway: HomeAway;
  /** Left out where the game is not being played, so neither side is marked. */
  hasBall?: boolean;
}) {
  return (
    <p className={`game-status__score --${homeAway}`}>
      {side.score}
      {hasBall != null && <Marker homeAway={homeAway} hasBall={hasBall} />}
    </p>
  );
}

/**
 * The two scores and, stacked either side of them, where the game is up to and what
 * the offense is facing.
 *
 * One block rather than three bands across the scoreline, so both lines are read
 * against the numbers they belong to instead of against the dialog's edges.
 */
function Center({ result }: { result: LeagueResult }) {
  // Marked only while the game is being played. Who has the ball is nobody's before
  // kickoff, and a marker left on the winner reads as a game still going.
  const marked = result.status === GameStatus.LIVE;
  const hasBall = (side: HomeAway) =>
    marked ? result.possession.homeAway === side : undefined;
  return (
    <div className="game-status__center">
      <Detail result={result} />
      <div className="game-status__scores">
        <Score
          side={result.home}
          homeAway={HomeAway.HOME}
          hasBall={hasBall(HomeAway.HOME)}
        />
        <span aria-hidden="true" className="game-status__dash">
          {SCORE_DASH}
        </span>
        <Score
          side={result.away}
          homeAway={HomeAway.AWAY}
          hasBall={hasBall(HomeAway.AWAY)}
        />
      </div>
      <Down result={result} />
    </div>
  );
}

/** One part of the strip above the scoreline, as a bar over the text it stands in for. */
function WireframeMetaGroup({ parts }: { parts: Array<string> }) {
  return (
    <span className="game-status__meta-group">
      {parts.map((part) => (
        <span key={part} className="game-status__bar --text">
          {part}
        </span>
      ))}
    </span>
  );
}

/** A side of the scoreline, at the size the week's own copy of it comes out. */
function WireframeSide({
  side,
  homeAway,
}: {
  side: GameSide;
  homeAway: HomeAway;
}) {
  return (
    /* The classes the game's own pieces carry, so a bar is laid out where the thing
       it stands in for will be. */
    <div className={`game-status__side --${homeAway}`}>
      <span className="game-status__logo game-status__bar" />
      <div className="game-status__team">
        <span className="game-status__side-label game-status__bar --text">
          {homeAway === HomeAway.HOME ? "Home" : "Away"}
        </span>
        <span className="game-status__team-name game-status__bar --text">
          <span className="game-status__name-full">{side.team.name}</span>
          <span className="game-status__name-short">
            {side.team.abbreviation}
          </span>
        </span>
        <span className="game-status__record game-status__bar --text">
          {side.record}
        </span>
      </div>
    </div>
  );
}

/**
 * The scoreline before the game it holds has been fetched.
 *
 * Built from the game as the week was scored, with every line of it hidden and a bar
 * drawn over it. The wait is then the size the answer will be, down to a name that
 * takes two lines and a venue that takes its own, so nothing under the dialog moves
 * when the answer lands. What is on the way is the same game, so the only thing the
 * week's copy of it can be wrong about is a score or a clock.
 *
 * Crossed by the one sheen the tables' wireframe uses, so a wait looks the same
 * wherever the app is waiting.
 */
function Wireframe({ result }: { result: LeagueResult }) {
  const venue = venueParts(result);
  return (
    <div className="game-status --skeleton">
      {/* Nothing below is worth reading out, so this says what it stands in for. */}
      <span className="game-status__sr-only" role="status">
        Loading the game
      </span>
      <div aria-hidden="true" className="game-status__meta">
        <WireframeMetaGroup parts={kickoffParts(result.date)} />
        {venue != null && <WireframeMetaGroup parts={venue} />}
      </div>
      <div aria-hidden="true" className="game-status__scoreline">
        <WireframeSide side={result.home} homeAway={HomeAway.HOME} />
        {/* The classes the block's own lines carry as well as a bar's, so each bar is
            laid where the line it stands in for is laid. */}
        <div className="game-status__center">
          <span className="game-status__detail game-status__bar --text">
            {detailText(result)}
          </span>
          <div className="game-status__scores">
            <span className="game-status__score game-status__bar --score" />
            <span className="game-status__dash">{SCORE_DASH}</span>
            <span className="game-status__score game-status__bar --score" />
          </div>
          {result.status === GameStatus.LIVE && (
            <span className="game-status__down game-status__bar --text">
              {result.possession.downDistanceText ?? NO_DOWN}
            </span>
          )}
        </div>
        <WireframeSide side={result.away} homeAway={HomeAway.AWAY} />
      </div>
      {/* Only where the game the week was scored at was being played, which is the
          only game the fetch will come back with a link for. */}
      {result.status === GameStatus.LIVE && (
        <span
          aria-hidden="true"
          className="game-status__gamecast game-status__bar --text"
        >
          {GAMECAST_LABEL}
        </span>
      )}
    </div>
  );
}

/** A side's mark and text. Its score is in the block between the two sides. */
function Side({
  side,
  homeAway,
  logoUrl,
  onLogoError,
}: {
  side: GameSide;
  homeAway: HomeAway;
  /** Left out where either side has no mark to draw, so neither draws one. */
  logoUrl?: string;
  onLogoError: () => void;
}) {
  return (
    <div className={`game-status__side --${homeAway}`}>
      {logoUrl != null && (
        <img
          className="game-status__logo"
          src={logoUrl}
          // The team's name is beside it, so the mark says nothing a reader of the
          // page in words is missing.
          alt=""
          onError={onLogoError}
        />
      )}
      <div className="game-status__team">
        <span className="game-status__side-label">
          {homeAway === HomeAway.HOME ? "Home" : "Away"}
        </span>
        <span className="game-status__team-name">
          {/* The abbreviation on a phone and the name once there is width for it.
              Both are in the page, so neither costs a measurement to choose
              between, and the one read out is the name however narrow the screen. */}
          <span className="game-status__name-full">{side.team.name}</span>
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

/**
 * A game the way ESPN's own boxscore says it: each side out on its own edge, the two
 * scores meeting at a dash between them, with where the game is up to over those scores
 * and what the offense faces under them.
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
    return <Wireframe result={game.result} />;
  }

  const venue = venueParts(result);

  // Both marks or neither: one side wearing its logo while the other shows a broken
  // image, or nothing at all, reads as the app having lost track of a team.
  const logos =
    result.away.team.logoUrl != null &&
    result.home.team.logoUrl != null &&
    logolessId !== result.id;
  const dropLogos = () => setLogolessId(result.id);

  return (
    <div className="game-status">
      <div className="game-status__meta">
        <MetaGroup parts={kickoffParts(result.date)} />
        {venue != null && <MetaGroup parts={venue} />}
      </div>
      <div className="game-status__scoreline">
        <Side
          side={result.home}
          homeAway={HomeAway.HOME}
          logoUrl={logos ? result.home.team.logoUrl : undefined}
          onLogoError={dropLogos}
        />
        <Center result={result} />
        <Side
          side={result.away}
          homeAway={HomeAway.AWAY}
          logoUrl={logos ? result.away.team.logoUrl : undefined}
          onLogoError={dropLogos}
        />
      </div>
      {/* Only while the game is being played, which is the one state the dialog
          cannot say enough about: a play by play, a drive chart and the leaders are
          all ESPN's. A game that is over is fully told above. */}
      {result.status === GameStatus.LIVE && result.gamecastUrl != null && (
        <a
          className="game-status__gamecast"
          href={result.gamecastUrl}
          target="_blank"
          rel="noreferrer"
        >
          {GAMECAST_LABEL}
        </a>
      )}
    </div>
  );
}
