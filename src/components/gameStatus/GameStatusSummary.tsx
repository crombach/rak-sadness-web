import { useState } from "react";
import { GameStatus, HomeAway } from "../../types/ESPN";
import { GameSide, LeagueResult } from "../../types/LeagueResult";
import { WeekGame } from "../../types/WeekGame";
import "./GameStatusSummary.scss";

/** Regulation is four quarters, and anything past them is overtime. */
const REGULATION_PERIODS = 4;

/** Joins the two scores where they meet, which is on a screen too narrow for three
 * columns. */
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

function Detail({ result }: { result: LeagueResult }) {
  return <p className="game-status__detail">{detailText(result)}</p>;
}

/**
 * How the game stands, which is where it is up to and, while it is being played, what
 * the offense is facing. Who has the ball is left to the marker beside their score.
 *
 * No points by quarter: the pool is scored on the game's own result, so a quarter's
 * points are of no use to anyone reading this.
 */
function Center({ result }: { result: LeagueResult }) {
  return (
    <>
      <Detail result={result} />
      {result.possession.downDistanceText != null && (
        <p className="game-status__down">
          {result.possession.downDistanceText}
        </p>
      )}
    </>
  );
}

/** A side of the scoreline with nothing in it yet, at the size it will come out. */
function WireframeSide({ homeAway }: { homeAway: HomeAway }) {
  return (
    /* The classes the game's own pieces carry, so a bar is laid out where the thing
       it stands in for will be. */
    <div className={`game-status__side --${homeAway}`}>
      <span className="game-status__logo game-status__bar" />
      <div className="game-status__team">
        <span className="game-status__side-label game-status__bar --label" />
        <span className="game-status__team-name game-status__bar --name" />
        <span className="game-status__record game-status__bar --record" />
      </div>
      <span className="game-status__score game-status__bar --score" />
    </div>
  );
}

/**
 * The scoreline before the game it holds has been fetched.
 *
 * Shaped like the game it stands in for, and crossed by the one sheen the tables'
 * wireframe uses, so a wait looks the same wherever the app is waiting.
 */
function Wireframe() {
  return (
    <div className="game-status --skeleton">
      {/* Nothing below is worth reading out, so this says what it stands in for. */}
      <span className="game-status__sr-only" role="status">
        Loading the game
      </span>
      <div aria-hidden="true" className="game-status__meta">
        <span className="game-status__bar --meta" />
      </div>
      <div aria-hidden="true" className="game-status__scoreline">
        <WireframeSide homeAway={HomeAway.HOME} />
        <span className="game-status__dash">{SCORE_DASH}</span>
        <div className="game-status__center">
          <span className="game-status__bar --detail" />
          <span className="game-status__bar --detail-narrow" />
        </div>
        <WireframeSide homeAway={HomeAway.AWAY} />
      </div>
    </div>
  );
}

function Side({
  side,
  homeAway,
  hasBall,
  logoUrl,
  onLogoError,
}: {
  side: GameSide;
  homeAway: HomeAway;
  hasBall: boolean;
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
      <p className="game-status__score">
        {side.score}
        {hasBall && (
          <span className="game-status__marker" aria-label="Has the ball">
            {MARKER[homeAway]}
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * A game the way ESPN's own boxscore says it: each side out on its own edge with
 * its score inboard, and how the game stands between them.
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
    return <Wireframe />;
  }

  const venue = venueParts(result);
  // Who has the ball, which is nobody once the game is over: a marker left on the
  // winner reads as a game still being played.
  const hasBall =
    result.status !== GameStatus.FINAL ? result.possession.homeAway : undefined;

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
          hasBall={hasBall === HomeAway.HOME}
          logoUrl={logos ? result.home.team.logoUrl : undefined}
          onLogoError={dropLogos}
        />
        <span aria-hidden="true" className="game-status__dash">
          {SCORE_DASH}
        </span>
        <div className="game-status__center">
          <Center result={result} />
        </div>
        <Side
          side={result.away}
          homeAway={HomeAway.AWAY}
          hasBall={hasBall === HomeAway.AWAY}
          logoUrl={logos ? result.away.team.logoUrl : undefined}
          onLogoError={dropLogos}
        />
      </div>
    </div>
  );
}
