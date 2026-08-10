import TableShell from "./TableShell";
import "./SkeletonTable.scss";

/** A stand-in. The real width is not known until the picks have been read. */
const COLUMN_COUNT = 8;

/**
 * A wireframe of a results table, for while the real one is being worked out.
 *
 * Every row is a filler row, so the shell carries it to the bottom of the
 * viewport.
 */
export default function SkeletonTable() {
  return (
    <TableShell
      className="--skeleton"
      columnCount={COLUMN_COUNT}
      header={Array.from({ length: COLUMN_COUNT }, (_, column) => (
        <th key={column}>
          <span className="skeleton__bar" />
        </th>
      ))}
      fillerCellContent={<span className="skeleton__bar" />}
    />
  );
}
