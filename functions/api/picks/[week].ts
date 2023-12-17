type Env = {
  RAK_SADNESS_BUCKET: R2Bucket;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const week = Number(context.params.week);

  // Get the spreadsheet from R2.
  const filePath = `picks/${week}.xlsx`;
  console.log(`Fetching picks for week ${week} from ${filePath}`);
  try {
    const spreadsheet = await context.env.RAK_SADNESS_BUCKET.get(filePath);

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
        "Content-Disposition": `attachment; filename=week-${week}-picks.xlsx`,
      },
    });
  } catch (error) {
    return new Response("Not Found", { status: 404 });
  }
};
