import { Fragment, ReactNode, useState } from "react";
import {
  MondayNightOutlook,
  PlayerAnalysis,
  RemainingPick,
  UncontrolledGame,
  VictoryRoute,
} from "../../types/PlayerAnalysis";
import { PlayerScore, RakMadnessScores } from "../../types/RakMadnessScores";
import remainingGames from "../../utils/scoring/remainingGames";
import Button from "../button/Button";
import "./AnalysisSummary.scss";

/** How many routes stand open, the rest being a click away. */
const ROUTES_SHOWN_AT_FIRST = 4;

type PathsResult = Extract<PlayerAnalysis, { kind: "paths" }>;

/** The outlooks worth a sentence: a week won outright says so on its own line. */
type DecidingOutlook = Exclude<MondayNightOutlook, { kind: "notNeeded" }>;

/** The one outlook a route of its own carries, which is a total still to come. */
type MondayNightRange = Extract<MondayNightOutlook, { kind: "range" }>;

const NAMES = new Intl.ListFormat("en-US");

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** Whether any pick has been settled, which is when a standing means anything. */
function hasKickedOff(players: Array<PlayerScore>): boolean {
  return players.some((player) =>
    [...player.college, ...player.pro].some(
      (pick) => pick.status === "yes" || pick.status === "no",
    ),
  );
}

/**
 * Where the week stands, which the scores already say. Read straight off them so
 * it is on screen before anyone is picked, and while their routes are worked out.
 */
export function Standing({
  scores,
  player,
}: {
  scores?: RakMadnessScores;
  player?: string;
}) {
  const players = scores?.scores ?? [];
  const [leader] = players;
  if (leader == null) return null;
  const top = leader.score.total;
  const chosen = players.find((it) => it.name === player);
  const leaders = players.filter((it) => it.score.total === top).length;
  const lead =
    leaders > 1
      ? `${leaders} players lead with ${plural(top, "point")}`
      : `${leader.name} leads with ${plural(top, "point")}`;
  const behind = chosen != null ? top - chosen.score.total : null;
  return (
    <p className="analysis__standing">
      {!hasKickedOff(players)
        ? "No finished games"
        : behind == null
          ? lead
          : behind > 0
            ? `${plural(behind, "point")} behind ${leader.name}`
            : "Tied for the lead"}
      {" · "}
      {plural(remainingGames(players).length, "game")} still to play
    </p>
  );
}

/** Whatever the answer turns out to be, it plays in under the same wrapper. */
function Answer({ children }: { children: ReactNode }) {
  return <div className="analysis">{children}</div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="analysis__section">
      <h3 className="analysis__section-title">{title}</h3>
      {children}
    </section>
  );
}

function Picks({
  games,
  className,
}: {
  games: Array<RemainingPick>;
  className?: string;
}) {
  return (
    <ul
      className={className ? `analysis__picks ${className}` : "analysis__picks"}
    >
      {games.map((game) => (
        <li key={game.label} className="analysis__pick">
          <span className="analysis__pick-label">{game.label}</span>
          <span className="analysis__pick-team">{game.pick}</span>
        </li>
      ))}
    </ul>
  );
}

/** The MNF points that win, named the way the scoreboard column is. */
function mondayNightPoints({ min, max }: MondayNightRange): string {
  if (min != null && max != null) {
    return min === max ? `MNF Points = ${min}` : `${min} ≤ MNF Points ≤ ${max}`;
  }
  return min != null ? `MNF Points ≥ ${min}` : `MNF Points ≤ ${max}`;
}

function mondayNightSentence(outlook: DecidingOutlook): string {
  if (outlook.kind === "settled") {
    return "MNF Points are already final, so the games above settle it.";
  }
  return `${mondayNightPoints(outlook)} to beat ${NAMES.format(outlook.contenders)}.`;
}

/**
 * The total a route of its own asks for, set out the way its picks are: what to do
 * in the ink they use, and the words holding it together in the ink their labels
 * use. The two halves wrap as wholes, so a narrow screen breaks between them.
 */
function RouteMondayNight({ outlook }: { outlook: MondayNightRange }) {
  return (
    <p className="analysis__line analysis__route-mnf">
      <span className="analysis__pick-label">AND</span>
      <span className="analysis__route-mnf-terms">
        <span>{mondayNightPoints(outlook)}</span>
        <span>
          {/* A list rather than a sentence, since the line around it is one too,
              and what holds it together is grey the way the rest of it is. */}
          <span className="analysis__term">TO BEAT</span>{" "}
          {outlook.contenders.map((name, index) => (
            <Fragment key={name}>
              {index > 0 && <span className="analysis__term">, </span>}
              {name}
            </Fragment>
          ))}
        </span>
      </span>
    </p>
  );
}

/** Whether anything below the outright line asks the player for a game. */
function hasGames(result: PathsResult): boolean {
  return (
    result.mustWin.length > 0 ||
    result.pool != null ||
    (result.routes?.length ?? 0) > 0
  );
}

/** The fewest games a way through asks for, which the outright line is measured on. */
function fewestWins(result: PathsResult): number {
  // The routes are held fewest games first, so the shortest is the one on top.
  const fromGames =
    result.pool?.choose ?? result.routes?.[0]?.games.length ?? 0;
  return result.mustWin.length + fromGames;
}

/**
 * Winning the week on points alone leads, since it settles the tiebreaker before
 * the reader has to think about it. Where there is no such line the player is
 * named as standing instead, so the sections below never open on their own.
 */
function Lead({ result }: { result: PathsResult }) {
  const outright =
    result.mondayNight?.kind === "notNeeded"
      ? "Takes the week outright, whatever the MNF points come to."
      : // Only worth saying where it asks more than the routes below already do.
        result.outrightAt != null && result.outrightAt > fewestWins(result)
        ? `Winning ${plural(result.outrightAt, "game")} takes it outright.`
        : null;
  // Nothing below to lead into, and the closing sentence there is the answer.
  if (outright == null && !hasGames(result)) return null;
  return (
    <p className="analysis__line">
      {outright ?? `${result.player} is still live to win the week.`}
      {/* Hands over to the sections under it, which ask for less. */}
      {hasGames(result) &&
        (outright != null ? " Otherwise:" : " What it takes:")}
    </p>
  );
}

function MondayNight({ outlook }: { outlook?: MondayNightOutlook }) {
  if (outlook == null || outlook.kind === "notNeeded") return null;
  return (
    <Section title="MNF points">
      <p className="analysis__line">{mondayNightSentence(outlook)}</p>
    </Section>
  );
}

function NeedsHelp({ games }: { games: Array<UncontrolledGame> }) {
  if (games.length === 0) return null;
  return (
    <Section title="Out of your hands">
      <ul className="analysis__help">
        {games.map((game) => (
          <li key={game.label} className="analysis__line">
            <span className="analysis__pick-label">{game.label}</span> is blank
            on your sheet, so {NAMES.format(game.needsToMiss)} has to miss.
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** The alternatives, fewest games first, with the long tail folded away. */
function Routes({
  title,
  routes,
  hiddenCount,
  // Off where every route asks the same of the tiebreaker, which the section
  // below then states once rather than on each of them.
  showMondayNight,
}: {
  title: string;
  routes: Array<VictoryRoute>;
  hiddenCount: number;
  showMondayNight: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const folded = routes.length - ROUTES_SHOWN_AT_FIRST;
  const shown = isExpanded ? routes : routes.slice(0, ROUTES_SHOWN_AT_FIRST);
  return (
    <Section title={title}>
      <ol className="analysis__routes">
        {shown.map((route) => (
          <li
            key={route.games.map((game) => game.label).join()}
            className="analysis__route"
          >
            <Picks games={route.games} />
            {showMondayNight && route.mondayNight.kind === "range" && (
              <RouteMondayNight outlook={route.mondayNight} />
            )}
          </li>
        ))}
      </ol>
      {/* Worked out, then left off, so the count is what the reader is missing.
          Held back until they have asked for the rest and reached the end of them. */}
      {isExpanded && hiddenCount > 0 && (
        <p className="analysis__note --upright">
          {plural(hiddenCount, "other path")} found but not shown.
        </p>
      )}
      {folded > 0 && (
        <Button
          className="analysis__more"
          variant="soft"
          size="sm"
          ariaExpanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show fewer" : `Show ${plural(folded, "more path")}`}
        </Button>
      )}
    </Section>
  );
}

/** A line absent is one the answer did not call for, so the caller can pass it. */
function Message({ lines }: { lines: Array<string | undefined> }) {
  return (
    <div className="analysis__message">
      {lines
        .filter((line) => line != null)
        .map((line) => (
          <p key={line} className="analysis__line">
            {line}
          </p>
        ))}
    </div>
  );
}

/** What the player has to do, or why there is nothing left to do about it. */
export default function AnalysisSummary({
  result,
}: {
  result?: PlayerAnalysis;
}) {
  // Nothing under the search until a name is picked, which the placeholder in it
  // already asks for.
  if (result == null) return null;

  if (result.kind === "eliminated") {
    return (
      <Answer>
        <Message
          lines={[`${result.player} cannot win this week.`, result.explanation]}
        />
      </Answer>
    );
  }

  if (result.kind === "clinched") {
    return (
      <Answer>
        <Message
          lines={[
            `${result.player} has already won the week.`,
            "Nothing still to be played can take it away.",
          ]}
        />
      </Answer>
    );
  }

  if (result.kind === "headline") {
    return (
      <Answer>
        <Message
          lines={[
            `${result.player} needs at least ${result.minimumWins} of their ${result.remainingPickCount} remaining picks.`,
            result.needsMondayNight
              ? "That is only enough to draw level, so the MNF points tiebreaker would still decide it."
              : undefined,
          ]}
        />
        {/* Why there is nothing below it, in the place the paths count theirs. */}
        <p className="analysis__note">
          Detailed paths are worked out once ten games are left.
        </p>
      </Answer>
    );
  }

  return (
    <Answer>
      <Lead result={result} />

      {result.mustWin.length > 0 && (
        <Section title="Must win">
          <Picks className="analysis__must-win" games={result.mustWin} />
        </Section>
      )}

      {result.pool && (
        <Section
          title={`${result.mustWin.length > 0 ? "Then any" : "Any"} ${result.pool.choose} of these`}
        >
          <Picks games={result.pool.games} />
        </Section>
      )}

      {result.routes != null && result.routes.length > 0 && (
        <Routes
          title={result.mustWin.length > 0 ? "Then one of" : "One of"}
          routes={result.routes}
          hiddenCount={result.hiddenRouteCount}
          showMondayNight={result.mondayNight == null}
        />
      )}

      {/* A picked player always reads a sentence. This is the one left where the
          games ask nothing and the line above said nothing either. */}
      {!hasGames(result) && result.mondayNight?.kind !== "notNeeded" && (
        <p className="analysis__line">
          No clean path to victory. The MNF points tiebreaker decides it.
        </p>
      )}

      <NeedsHelp games={result.needsHelp} />
      <MondayNight outlook={result.mondayNight} />
    </Answer>
  );
}
