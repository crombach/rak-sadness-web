import { ReactNode, useRef } from "react";
import useFillerRows from "../../hooks/useFillerRows";
import "./Table.scss";

/**
 * The frame both results tables share.
 *
 * Filler rows carry the table down to the bottom of the viewport when the real
 * rows do not reach it, so a short week does not leave the page half empty. The
 * trailing row keeps the last row clear of a phone's rounded corners and home
 * indicator. `Table.scss` sizes it from the safe area, so on a screen without one
 * it has no height at all.
 */
export default function TableShell({
  columnCount,
  header,
  className = "",
  fillerCellContent,
  children,
}: {
  columnCount: number;
  header: ReactNode;
  className?: string;
  /** Placed in every cell of every filler row. Empty cells without it. */
  fillerCellContent?: ReactNode;
  children?: ReactNode;
}) {
  const tableRef = useRef<HTMLTableElement>(null);
  const fillerRows = useFillerRows(tableRef);

  return (
    <table ref={tableRef} className={`table ${className}`} cellSpacing="0">
      <thead className="table__header">
        <tr>{header}</tr>
      </thead>
      <tbody>
        {children}
        {Array.from({ length: fillerRows }, (_, row) => (
          <tr key={`filler-${row}`} className="table__filler-row">
            {Array.from({ length: columnCount }, (_, column) => (
              <td key={column}>{fillerCellContent}</td>
            ))}
          </tr>
        ))}
        <tr className="table__last-row">
          <td colSpan={columnCount} />
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
