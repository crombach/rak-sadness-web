type Env = {
  RAK_MADNESS_BUCKET: R2Bucket;
};

/**
 * One week's picks workbook, from the season that started in `year`. A season
 * runs into the following January, so the 2025 season's week 18 was played in
 * January 2026 and is still filed under 2025.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const year = Number(context.params.year);
  const week = Number(context.params.week);
  if (!Number.isInteger(year) || !Number.isInteger(week)) {
    return new Response("Not Found", { status: 404 });
  }

  // Get the spreadsheet from R2.
  const filePath = `picks/${year}/${week}.xlsx`;
  console.log(`Fetching picks for ${year} week ${week} from ${filePath}`);
  let spreadsheet;
  try {
    spreadsheet = await context.env.RAK_MADNESS_BUCKET.get(filePath);
  } catch (error) {
    console.error("Failed to fetch picks", error);
    return new Response("Service Unavailable", { status: 503 });
  }
  if (!spreadsheet) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(spreadsheet.body, {
    status: 200,
    headers: {
      // Keep in sync with XLSX_CONTENT_TYPE in src/utils/buildSpreadsheetBuffer.ts;
      // the Functions bundle separately and can't import it.
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${year}-week-${week}-picks.xlsx`,
      // A given year and week's picks never change once uploaded.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
