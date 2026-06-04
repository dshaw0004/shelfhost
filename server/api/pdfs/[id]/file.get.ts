export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare ?? {};
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const pdf = await env.DB.prepare(`SELECT r2_key FROM pdfs WHERE id = ?`)
    .bind(id)
    .first();
  if (!pdf) throw createError({ statusCode: 404, message: "PDF not found" });

  const rangeHeader = getHeader(event, "Range");

  let object;
  if (rangeHeader) {
     const range = parseRangeHeader(rangeHeader);
     object = await env.BUCKET.get(pdf.r2_key as string, {
      range,
      onlyIf: { etagMatches: getHeader(event, "If-Match") }
    });
  } else {
     object = await env.BUCKET.get(pdf.r2_key as string);
  }

  if (!object)
    throw createError({
      statusCode: 404,
      message: "File not found in storage",
    });

  setHeaders(event, {
    "Content-Type": "application/pdf",
    "Cache-Control": "private, max-age=7884000",
    "Accept-Ranges": "bytes",
    "ETag": object.httpEtag,
  });

  if (object.range) {
    setResponseStatus(event, 206);
    const start = object.range.offset;
    const end = start + object.range.length - 1;
    const total = object.size;

    setHeader(
      event,
      "Content-Range",
      `bytes ${start}-${end}/${total}`
    );
    setHeader(event, "Content-Length", object.range.length);
  } else {
    setHeader(event, "Content-Length", object.size);
  }

  return sendStream(event, object.body);
});

function parseRangeHeader(header: string) {
  const range = header.replace(/bytes=/, "").split("-");

  if (!range[0] && range[1]) return { suffix: parseInt(range[1]) };

  const offset = parseInt(range[0]);
  let length;
  if (range[1]) {
      length = parseInt(range[1]) - offset + 1;
  }

  return { offset, length };
}
