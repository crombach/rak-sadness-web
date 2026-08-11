import { ReactNode } from "react";
import {
  MondayNightOutlook,
  PathsToVictory,
  RemainingPick,
  UncontrolledGame,
} from "../../types/PathsToVictory";
import "./VictorySummary.scss";

function list(names: Array<string>): string {
  if (names.length < 3) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

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

/** The totals that win, written the way someone would say them. */
function mondayNightSentence(outlook: MondayNightOutlook): string | null {
  if (outlook.kind === "settled") {
    return "Monday night is already final, so the games above settle it.";
  }
  if (outlook.kind === "notNeeded") {
    return "Takes the week outright, whatever Monday night comes to.";
  }
  const { min, max } = outlook;
  const total =
    min != null && max != null
      ? `between ${min} and ${max}`
      : min != null
        ? `of ${min} or more`
        : `of ${max} or less`;
  return `Needs a Monday night total ${total} to beat ${list(outlook.contenders)}.`;
}

function MondayNight({
  outlook,
  outrightAt,
  minimumWins,
}: {
  outlook?: MondayNightOutlook;
  outrightAt?: number;
  minimumWins: number;
}) {
  const sentence = outlook != null ? mondayNightSentence(outlook) : null;
  // Only worth saying where it asks for more than the routes above already do.
  const outright =
    outrightAt != null && outrightAt > minimumWins
      ? `Winning ${plural(outrightAt, "game")} instead takes it outright.`
      : null;
  if (sentence == null && outright == null) return null;
  return (
    <Section title="Monday night">
      {sentence && <p className="victory__line">{sentence}</p>}
      {outright && <p className="victory__line">{outright}</p>}
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
            on your sheet, so {list(game.needsToMiss)} has to miss.
          </li>
        ))}
      </ul>
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
  if (result == null) {
    return (
      <Message
        heading="Pick a player"
        body="Search above for anyone who made picks this week."
      />
    );
  }

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
        <p className="victory__standing">
          {plural(result.remainingGameCount, "game")} still to play
        </p>
        <Message
          heading={`${result.player} needs at least ${result.minimumWins} of their ${result.remainingPickCount} remaining picks.`}
          body={
            result.needsMondayNight
              ? "That is only enough to draw level, so the Monday night tiebreaker would still decide it. The routes are worked out once twelve games are left."
              : "The routes are worked out once twelve games are left."
          }
        />
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
      <p className="victory__standing">
        {result.pointsBehind > 0
          ? `${plural(result.pointsBehind, "point")} behind ${result.leader}`
          : "Level at the top"}
        {" · "}
        {plural(result.remainingGameCount, "game")} still to play
      </p>

      {result.mustWin.length > 0 && (
        <Section title="Must win">
          <Picks games={result.mustWin} />
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
        <Section title={result.mustWin.length > 0 ? "Then one of" : "One of"}>
          <ol className="victory__routes">
            {result.routes.map((route) => (
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
          {result.hiddenRouteCount > 0 && (
            <p className="victory__line">
              {plural(result.hiddenRouteCount, "other route")} not shown.
            </p>
          )}
        </Section>
      )}

      {result.mustWin.length === 0 && !result.pool && !result.routes && (
        <p className="victory__line">
          Nothing left to win. The tiebreaker below decides it.
        </p>
      )}

      <NeedsHelp games={result.needsHelp} />
      <MondayNight
        outlook={result.mondayNight}
        outrightAt={result.outrightAt}
        minimumWins={minimumWins}
      />
    </div>
  );
}
