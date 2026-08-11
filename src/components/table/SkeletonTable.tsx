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
/**
 * Two lines, because a pool full of long names leaves the real player column two
 * lines tall, and that is what sets the height of every row.
 */
const PLAYER = "Why is the Runn\nGone?";
const PICK = "TCU -13.5";
const SCORE = "10";

type Column = {
  header: string;
  cell: string;
  /** A game's column, which the real table centers and never wraps. */
  isPick?: boolean;
};

const SCOREBOARD_COLUMNS: Array<Column> = [
  { header: "Rank", cell: RANK },
  { header: "Player", cell: PLAYER },
  { header: "MNF Points Pick", cell: SCORE },
  { header: "MNF Points Distance", cell: SCORE },
  { header: "College Score", cell: SCORE },
  { header: "Pro Score", cell: SCORE },
  { header: "Pro Score ATS", cell: SCORE },
  { header: "Total Score", cell: SCORE },
];

function leagueColumns(count: number, prefix: string): Array<Column> {
  return Array.from({ length: count }, (_, game) => ({
    header: `${prefix}${game + 1}`,
    cell: PICK,
    isPick: true,
  }));
}

const PICKS_COLUMNS: Array<Column> = [
  { header: "Rank", cell: RANK },
  { header: "Player", cell: PLAYER },
  ...leagueColumns(COLLEGE_COUNT, "C"),
  { header: "College Score", cell: SCORE },
  ...leagueColumns(PRO_COUNT, "P"),
  { header: "Pro Score", cell: SCORE },
  { header: "Total Score", cell: SCORE },
];

/**
 * A wireframe of a results table, for while the real one is being worked out.
 *
 * Shaped like the view it stands in for, down to the column count and the row
 * count, so the page does not rearrange itself once the week arrives.
 */
export default function SkeletonTable({ view }: { view: ScoresView }) {
  const columns = view === "Picks" ? PICKS_COLUMNS : SCOREBOARD_COLUMNS;

  return (
    <TableShell
      className="--skeleton"
      columnCount={columns.length}
      header={columns.map((column, index) => (
        // A game's header is sized by `table__pick-header`'s own minimum, the way
        // the real one is, so it needs no stand-in text.
        <th
          key={index}
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
  );
}
