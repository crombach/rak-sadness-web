import { ScoresView } from "../navbar/ScoresNavbar";
import TableShell from "./TableShell";
import "./SkeletonTable.scss";

/**
 * Column widths read off loaded tables, in pixels. Only the ratios matter: the
 * wireframe spreads them across whatever width it is given.
 */
const SCOREBOARD_WIDTHS = [55, 242, 143, 178, 125, 93, 128, 103];
const RANK_WIDTH = 55;
const PLAYER_WIDTH = 156;
const PICK_WIDTH = 91;
const SCORE_WIDTH = 70;

/**
 * A middling week. The real count comes from the picks, which have not been read
 * yet, and a bowl week is a single college game against sixteen pro ones.
 */
const COLLEGE_COUNT = 6;
const PRO_COUNT = 13;

const PICKS_WIDTHS = [
  RANK_WIDTH,
  PLAYER_WIDTH,
  ...Array<number>(COLLEGE_COUNT).fill(PICK_WIDTH),
  SCORE_WIDTH,
  ...Array<number>(PRO_COUNT).fill(PICK_WIDTH),
  SCORE_WIDTH,
  SCORE_WIDTH,
];

/**
 * A wireframe of a results table, for while the real one is being worked out.
 *
 * Shaped like the view it stands in for, so the columns do not rearrange
 * themselves once the week arrives. Every row is a filler row, so the shell
 * carries it to the bottom of the viewport.
 */
export default function SkeletonTable({ view }: { view: ScoresView }) {
  const widths = view === "Picks" ? PICKS_WIDTHS : SCOREBOARD_WIDTHS;
  const total = widths.reduce((sum, width) => sum + width, 0);

  return (
    <TableShell
      className="--skeleton"
      columnCount={widths.length}
      header={widths.map((width, column) => (
        <th key={column} style={{ width: `${(width / total) * 100}%` }}>
          <span className="skeleton__bar" />
        </th>
      ))}
      fillerCellContent={<span className="skeleton__bar" />}
    />
  );
}
