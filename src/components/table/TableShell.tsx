import { ReactNode, useRef } from "react";
import useFillerRows, { FILLER_ROW_CLASS } from "../../hooks/useFillerRows";
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
  caption,
  columnCount,
  header,
  className = "",
  ariaBusy = false,
  ariaHidden = false,
  children,
}: {
  /** What the table shows, read by a screen reader alone: visually hidden. */
  caption?: ReactNode;
  columnCount: number;
  header: ReactNode;
  className?: string;
  /** Set while the real rows have not arrived yet. */
  ariaBusy?: boolean;
  /**
   * Set on the wireframe, which has nothing real to read out and would otherwise
   * cost a screen reader ~1500 empty cells.
   */
  ariaHidden?: boolean;
  children?: ReactNode;
}) {
  const tableRef = useRef<HTMLTableElement>(null);
  const fillerRows = useFillerRows(tableRef);

  return (
    <table
      ref={tableRef}
      className={`table ${className}`}
      cellSpacing="0"
      aria-busy={ariaBusy || undefined}
      aria-hidden={ariaHidden || undefined}
    >
      {caption != null && (
        <caption className="table__caption">{caption}</caption>
      )}
      <thead className="table__header">
        <tr>{header}</tr>
      </thead>
      <tbody>
        {children}
        {Array.from({ length: fillerRows }, (_, row) => (
          <tr key={`filler-${row}`} className={FILLER_ROW_CLASS}>
            {Array.from({ length: columnCount }, (_, column) => (
              <td key={column} />
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
