import { ReactNode, useState } from "react";
import {
  MondayNightOutlook,
  PathsToVictory,
  RemainingPick,
  UncontrolledGame,
  VictoryRoute,
} from "../../types/PathsToVictory";
import Button from "../button/Button";
import "./VictorySummary.scss";

/** How many routes stand open, the rest being a click away. */
const ROUTES_SHOWN_AT_FIRST = 4;

const NAMES = new Intl.ListFormat("en-US");

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="victory__section">
      <h3 className="victory__section-title">{title}</h3>
      {children}
    </section>
  );
}

function Picks({ games }: { games: Array<RemainingPick> }) {
  return (
    <ul className="victory__picks">
      {games.map((game) => (
        <li key={game.label} className="victory__pick">
          <span className="victory__pick-label">{game.label}</span>
          <span className="victory__pick-team">{game.pick}</span>
        </li>
      ))}
    </ul>
  );
}

/** The MNF points that win, named the way the scoreboard column is. */
function mondayNightSentence(outlook: MondayNightOutlook): string | null {
  if (outlook.kind === "settled") {
    return "MNF points are already final, so the games above settle it.";
  }
  if (outlook.kind === "notNeeded") {
    return "Takes the week outright, whatever the MNF points come to.";
  }
  const { min, max } = outlook;
  const points =
    min != null && max != null
      ? min === max
        ? `MNF points = ${min}`
        : `${min} ≤ MNF points ≤ ${max}`
      : min != null
        ? `MNF points ≥ ${min}`
        : `MNF points ≤ ${max}`;
  return `${points} to beat ${NAMES.format(outlook.contenders)}.`;
}

/**
 * Winning the week on points alone leads, since it settles the tiebreaker before
 * the reader has to think about it.
 */
function Outright({
  outlook,
  outrightAt,
  minimumWins,
}: {
  outlook?: MondayNightOutlook;
  outrightAt?: number;
  minimumWins: number;
}) {
  const lines = [
    outlook?.kind === "notNeeded"
      ? "Takes the week outright, whatever the MNF points come to."
      : null,
    // Only worth saying where it asks for more than the routes below already do.
    outrightAt != null && outrightAt > minimumWins
      ? `Winning ${plural(outrightAt, "game")} instead takes it outright.`
      : null,
  ].filter((line) => line != null);
  if (lines.length === 0) return null;
  return lines.map((line) => (
    <p key={line} className="victory__line">
      {line}
    </p>
  ));
}

function MondayNight({ outlook }: { outlook?: MondayNightOutlook }) {
  const sentence =
    outlook != null && outlook.kind !== "notNeeded"
      ? mondayNightSentence(outlook)
      : null;
  if (sentence == null) return null;
  return (
    <Section title="MNF points">
      <p className="victory__line">{sentence}</p>
    </Section>
  );
}

function NeedsHelp({ games }: { games: Array<UncontrolledGame> }) {
  if (games.length === 0) return null;
  return (
    <Section title="Out of your hands">
      <ul className="victory__help">
        {games.map((game) => (
          <li key={game.label} className="victory__line">
            <span className="victory__pick-label">{game.label}</span> is blank
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
  hiddenRouteCount,
}: {
  title: string;
  routes: Array<VictoryRoute>;
  hiddenRouteCount: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const folded = routes.length - ROUTES_SHOWN_AT_FIRST;
  const shown = isExpanded ? routes : routes.slice(0, ROUTES_SHOWN_AT_FIRST);
  return (
    <Section title={title}>
      <ol className="victory__routes">
        {shown.map((route) => (
          <li
            key={route.games.map((game) => game.label).join()}
            className="victory__route"
          >
            <Picks games={route.games} />
            {route.mondayNight.kind === "range" && (
              <p className="victory__line">
                {mondayNightSentence(route.mondayNight)}
              </p>
            )}
          </li>
        ))}
      </ol>
      {folded > 0 && (
        <Button
          className="victory__more"
          variant="soft"
          size="sm"
          ariaExpanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show fewer" : `Show ${plural(folded, "more route")}`}
        </Button>
      )}
      {hiddenRouteCount > 0 && (
        <p className="victory__line">
          {plural(hiddenRouteCount, "other route")} not shown.
        </p>
      )}
    </Section>
  );
}

function Message({ heading, body }: { heading: string; body?: string }) {
  return (
    <div className="victory__message">
      <p className="victory__heading">{heading}</p>
      {body && <p className="victory__line">{body}</p>}
    </div>
  );
}

/** What the player has to do, or why there is nothing left to do about it. */
export default function VictorySummary({
  result,
}: {
  result?: PathsToVictory;
}) {
  // Nothing under the search until a name is picked, which the placeholder in it
  // already asks for.
  if (result == null) return null;

  if (result.kind === "eliminated") {
    return (
      <Message
        heading={`${result.player} cannot win this week.`}
        body={result.explanation}
      />
    );
  }

  if (result.kind === "clinched") {
    return (
      <Message
        heading={`${result.player} has already won the week.`}
        body="Nothing still to be played can take it away."
      />
    );
  }

  if (result.kind === "headline") {
    return (
      <div className="victory">
        <Message
          heading={`${result.player} needs at least ${result.minimumWins} of their ${result.remainingPickCount} remaining picks.`}
          body={
            result.needsMondayNight
              ? "That is only enough to draw level, so the MNF points tiebreaker would still decide it. The routes are worked out once ten games are left."
              : "The routes are worked out once ten games are left."
          }
        />
        <p className="victory__standing">
          {plural(result.remainingGameCount, "game")} still to play
        </p>
      </div>
    );
  }

  const fromPool = result.pool?.choose ?? 0;
  const fromRoutes = result.routes?.length
    ? Math.min(...result.routes.map((route) => route.games.length))
    : 0;
  const minimumWins = result.mustWin.length + Math.max(fromPool, fromRoutes);

  return (
    <div className="victory">
      <Outright
        outlook={result.mondayNight}
        outrightAt={result.outrightAt}
        minimumWins={minimumWins}
      />

      {result.mustWin.length > 0 && (
        <Section title="Must win">
          <div className="victory__must-win">
            <Picks games={result.mustWin} />
          </div>
        </Section>
      )}

      {result.pool && (
        <Section
          title={`${result.mustWin.length > 0 ? "Then any" : "Any"} ${result.pool.choose} of these`}
        >
          <Picks games={result.pool.games} />
        </Section>
      )}

      {result.routes && (
        <Routes
          key={result.player}
          title={result.mustWin.length > 0 ? "Then one of" : "One of"}
          routes={result.routes}
          hiddenRouteCount={result.hiddenRouteCount}
        />
      )}

      {result.mustWin.length === 0 && !result.pool && !result.routes && (
        <p className="victory__line">
          Nothing left to win. The tiebreaker below decides it.
        </p>
      )}

      <NeedsHelp games={result.needsHelp} />
      <MondayNight outlook={result.mondayNight} />

      <p className="victory__standing">
        {result.pointsBehind > 0
          ? `${plural(result.pointsBehind, "point")} behind ${result.leader}`
          : "Level at the top"}
        {" · "}
        {plural(result.remainingGameCount, "game")} still to play
      </p>
    </div>
  );
}
