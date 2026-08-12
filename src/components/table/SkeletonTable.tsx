import { memo } from "react";
import rangeWithPrefix from "../../utils/rangeWithPrefix";
import { ScoresView } from "../navbar/ScoresNavbar";
import TableShell from "./TableShell";
import "./SkeletonTable.scss";

/**
 * A middling week's shape, week 5's: six college games, thirteen pro, sixty-one
 * players. The real numbers come from the picks, which have not been read yet.
 */
const COLLEGE_COUNT = 6;
const PRO_COUNT = 13;
const PLAYER_COUNT = 61;

/**
 * Stand-in text, each as long as the widest a real cell of that kind gets. The
 * stylesheet draws it invisibly from `data-skeleton-text`, and the table's own
 * `max-content` sizing measures it, so the wireframe comes out the size the loaded
 * table will be at any font size without a single width being written down. It
 * stays out of the DOM's text so nothing reads or matches a placeholder.
 */
const RANK = "10";
/** Eighteen characters, the longest a real name gets before it is cut short. */
const PLAYER = "Why is the Runn Go";
const PICK = "TCU -13.5";
const SCORE = "10";

type Column = {
  header: string;
  cell: string;
  /** A game's column, which the real table centers and never wraps. */
  isPick?: boolean;
};

/** Both views open on these and close on a total. */
const RANK_AND_PLAYER: Array<Column> = [
  { header: "Rank", cell: RANK },
  { header: "Player", cell: PLAYER },
];
const TOTAL_SCORE: Column = { header: "Total Score", cell: SCORE };

const SCOREBOARD_COLUMNS: Array<Column> = [
  ...RANK_AND_PLAYER,
  { header: "MNF Points Pick", cell: SCORE },
  { header: "MNF Points Distance", cell: SCORE },
  { header: "College Score", cell: SCORE },
  { header: "Pro Score", cell: SCORE },
  { header: "Pro Score ATS", cell: SCORE },
  TOTAL_SCORE,
];

function leagueColumns(count: number, prefix: string): Array<Column> {
  return rangeWithPrefix(count, prefix).map((header) => ({
    header,
    cell: PICK,
    isPick: true,
  }));
}

const PICKS_COLUMNS: Array<Column> = [
  ...RANK_AND_PLAYER,
  ...leagueColumns(COLLEGE_COUNT, "C"),
  { header: "College Score", cell: SCORE },
  ...leagueColumns(PRO_COUNT, "P"),
  { header: "Pro Score", cell: SCORE },
  TOTAL_SCORE,
];

/**
 * A wireframe of a results table, for while the real one is being worked out.
 *
 * Shaped like the view it stands in for, down to the column count and the row
 * count, so the page does not rearrange itself once the week arrives.
 *
 * Memoized because it is well over a thousand cells and its route re-renders on
 * every flag the week's loading sets, all of them while this is on screen.
 */
function SkeletonTable({ view }: { view: ScoresView }) {
  const columns = view === "Picks" ? PICKS_COLUMNS : SCOREBOARD_COLUMNS;

  return (
    <>
      {/*
        A screen reader has nothing to read out of the wireframe below, hidden
        entirely, so this says what it stands in for instead.
      */}
      <span className="skeleton__status" role="status">
        Loading {view.toLowerCase()} results
      </span>
      <TableShell
        className="--skeleton"
        columnCount={columns.length}
        ariaBusy
        ariaHidden
        header={columns.map((column, index) => (
          // A game's header is sized by `table__pick-header`'s own minimum, the way
          // the real one is, so it needs no stand-in text.
          <th
            key={index}
            scope="col"
            data-skeleton-text={column.isPick ? undefined : column.header}
          >
            {column.isPick && <span className="table__pick-header" />}
            <span className="skeleton__bar" />
          </th>
        ))}
      >
        {Array.from({ length: PLAYER_COUNT }, (_, row) => (
          <tr key={row}>
            {columns.map((column, index) => (
              <td
                key={index}
                className={
                  column.isPick ? "table__center table__pick" : undefined
                }
                data-skeleton-text={column.cell}
              >
                <span className="skeleton__bar" />
              </td>
            ))}
          </tr>
        ))}
      </TableShell>
    </>
  );
}

export default memo(SkeletonTable);
