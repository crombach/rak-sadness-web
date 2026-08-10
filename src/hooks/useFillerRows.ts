import { RefObject, useCallback, useLayoutEffect, useState } from "react";

/** Matches `--rak-table-row-height`, for the render before the table is measured. */
const DEFAULT_ROW_HEIGHT = 32;

/**
 * How many empty rows fit below the table's real ones.
 *
 * `currentCount` is what the table is already padded by, so the spare space is
 * measured against the content alone. Feeding the answer back in leaves it
 * unchanged, which is what keeps this from oscillating as the rows it adds change
 * the height it measures.
 */
export function fillerRowCount({
  viewportHeight,
  tableTop,
  tableHeight,
  rowHeight,
  currentCount,
}: {
  viewportHeight: number;
  tableTop: number;
  tableHeight: number;
  rowHeight: number;
  currentCount: number;
}): number {
  if (rowHeight <= 0) {
    return 0;
  }
  const contentHeight = tableHeight - currentCount * rowHeight;
  const spare = viewportHeight - tableTop - contentHeight;
  return Math.max(Math.floor(spare / rowHeight), 0);
}

function readRowHeight(table: HTMLElement): number {
  const declared = getComputedStyle(table).getPropertyValue(
    "--rak-table-row-height",
  );
  return Number.parseFloat(declared) || DEFAULT_ROW_HEIGHT;
}

/**
 * Pads a table out to the bottom of the viewport, so a short one does not leave
 * the page half empty. Measured in a layout effect, so the rows are there before
 * the first paint.
 */
export default function useFillerRows(
  tableRef: RefObject<HTMLTableElement | null>,
): number {
  const [count, setCount] = useState(0);

  const measure = useCallback(() => {
    const table = tableRef.current;
    if (table == null) return;
    const { top, height } = table.getBoundingClientRect();
    setCount((currentCount) =>
      fillerRowCount({
        viewportHeight: window.innerHeight,
        tableTop: top,
        tableHeight: height,
        rowHeight: readRowHeight(table),
        currentCount,
      }),
    );
  }, [tableRef]);

  useLayoutEffect(() => {
    measure();
    const table = tableRef.current;
    // The table resizes without the window doing so: a view switch, or scores
    // arriving. ResizeObserver catches both.
    const observer =
      table != null && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : undefined;
    if (table != null) observer?.observe(table);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, tableRef]);

  return count;
}
