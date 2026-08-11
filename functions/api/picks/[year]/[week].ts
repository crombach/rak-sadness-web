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
  try {
    const spreadsheet = await context.env.RAK_MADNESS_BUCKET.get(filePath);
    if (!spreadsheet) {
      return new Response("Not Found", { status: 404 });
    }

    // Create an identity TransformStream (a.k.a. a pipe).
    // The readable side will become our new response body.
    const { readable, writable } = new TransformStream();

    // Start pumping the body.
    spreadsheet.body.pipeTo(writable);

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=${year}-week-${week}-picks.xlsx`,
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
};
