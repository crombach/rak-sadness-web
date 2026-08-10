import { ReactNode } from "react";
import rangeWithPrefix from "../../utils/rangeWithPrefix";
import "./Table.scss";

/**
 * The frame both results tables share.
 *
 * The trailing row exists to keep the last real row clear of a phone's rounded
 * corners and home indicator. `Table.scss` sizes it from the safe area, so on a
 * screen without one it has no height at all.
 */
export default function TableShell({
  columnCount,
  header,
  children,
}: {
  columnCount: number;
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <table className="table" cellSpacing="0">
      <thead className="table__header">
        <tr>{header}</tr>
      </thead>
      <tbody>
        {children}
        <tr className="table__last-row">
          {rangeWithPrefix(columnCount).map((key) => (
            <td key={key} />
          ))}
        </tr>
      </tbody>
    </table>
  );
}

export function RankCell({ rank }: { rank: number }) {
  return (
    <td>
      <b>{rank}</b>
    </td>
  );
}
