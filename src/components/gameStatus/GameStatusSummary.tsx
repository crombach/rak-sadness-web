import { GameStatus, HomeAway } from "../../types/ESPN";
import { GameSide, LeagueResult } from "../../types/LeagueResult";
import { WeekGame } from "../../types/WeekGame";
import "./GameStatusSummary.scss";

/** Regulation is four quarters, and anything past them is overtime. */
const REGULATION_PERIODS = 4;

/** Points the reader at the score it belongs to, from whichever side it is on. */
const MARKER: Record<HomeAway, string> = {
  [HomeAway.AWAY]: "◂",
  [HomeAway.HOME]: "▸",
};

function kickoff(date: Date): string {
  const day = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

function venueLine(result: LeagueResult): string | undefined {
  const { venue } = result;
  if (venue == null) return undefined;
  const place = [venue.city, venue.state].filter((it) => it != null).join(", ");
  return place !== "" ? `${venue.name} · ${place}` : venue.name;
}

/** `1`…`4`, then `OT`, `2OT`, for as many periods as were played. */
function periodLabels(count: number): Array<string> {
  return [...Array(count).keys()].map((index) => {
    const period = index + 1;
    if (period <= REGULATION_PERIODS) return String(period);
    const overtime = period - REGULATION_PERIODS;
    return overtime === 1 ? "OT" : `${overtime}OT`;
  });
}

function LinescoreRow({ side, periods }: { side: GameSide; periods: number }) {
  return (
    <tr>
      <th scope="row">{side.team.abbreviation}</th>
      {[...Array(periods).keys()].map((index) => (
        <td key={index}>{side.linescores[index] ?? "-"}</td>
      ))}
      <td className="game-status__total">{side.score}</td>
    </tr>
  );
}

/** How the game stands, which is a different thing to say at each stage of one. */
function Center({ result }: { result: LeagueResult }) {
  const periods = Math.max(
    result.away.linescores.length,
    result.home.linescores.length,
  );

  if (result.status === GameStatus.FINAL && periods > 0) {
    return (
      <>
        <p className="game-status__detail">{result.detailMessage}</p>
        <table className="game-status__linescores">
          <caption className="game-status__sr-only">Points by quarter</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="game-status__sr-only">Team</span>
              </th>
              {periodLabels(periods).map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
              <th scope="col">T</th>
            </tr>
          </thead>
          <tbody>
            <LinescoreRow side={result.away} periods={periods} />
            <LinescoreRow side={result.home} periods={periods} />
          </tbody>
        </table>
      </>
    );
  }

  // Everything the app knows about a game still being played. `detailMessage`
  // carries the quarter and the clock together, which is how ESPN says it.
  const possessing =
    result.possession.homeAway != null
      ? result[result.possession.homeAway].team.abbreviation
      : undefined;
  return (
    <>
      <p className="game-status__detail">{result.detailMessage}</p>
      {possessing != null && (
        <p className="game-status__possession">{possessing} ball</p>
      )}
      {result.possession.downDistanceText != null && (
        <p className="game-status__down">
          {result.possession.downDistanceText}
        </p>
      )}
    </>
  );
}

function Side({
  side,
  homeAway,
  marked,
  markerLabel,
}: {
  side: GameSide;
  homeAway: HomeAway;
  /** Set on the side with the ball, or the side that won. */
  marked: boolean;
  markerLabel: string;
}) {
  return (
    <div className={`game-status__side --${homeAway}`}>
      <div className="game-status__team">
        <span className="game-status__side-label">
          {homeAway === HomeAway.HOME ? "Home" : "Away"}
        </span>
        <span className="game-status__team-name">{side.team.name}</span>
        {side.record != null && (
          <span className="game-status__record">{side.record}</span>
        )}
      </div>
      <p className="game-status__score">
        {side.score}
        {marked && (
          <span className="game-status__marker" aria-label={markerLabel}>
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
 * `result` is the game as it was last fetched, which is not always the column
 * `game` names: while the next game is on its way the one before it stays up.
 * Nothing is drawn before the first fetch lands, so a live game is never shown at
 * the score the week was last worked out at.
 */
export default function GameStatusSummary({
  game,
  result,
}: {
  game?: WeekGame;
  result?: LeagueResult;
}) {
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
  if (result == null) {
    return null;
  }

  const venue = venueLine(result);
  const isFinal = result.status === GameStatus.FINAL;
  const marked = isFinal ? result.winner.homeAway : result.possession.homeAway;
  const markerLabel = isFinal ? "Winner" : "Has the ball";

  return (
    <div className="game-status">
      <div className="game-status__meta">
        <span>{kickoff(result.date)}</span>
        {venue != null && <span>{venue}</span>}
      </div>
      <div className="game-status__scoreline">
        <Side
          side={result.away}
          homeAway={HomeAway.AWAY}
          marked={marked === HomeAway.AWAY}
          markerLabel={markerLabel}
        />
        <div className="game-status__center">
          <Center result={result} />
        </div>
        <Side
          side={result.home}
          homeAway={HomeAway.HOME}
          marked={marked === HomeAway.HOME}
          markerLabel={markerLabel}
        />
      </div>
      {result.gamecastUrl != null && (
        <a
          className="game-status__gamecast"
          href={result.gamecastUrl}
          target="_blank"
          rel="noreferrer"
        >
          ESPN Gamecast
        </a>
      )}
    </div>
  );
}
