export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env;
  if (!env)
    throw createError({
      statusCode: 503,
      message:
        "Database not available (run with wrangler dev for local D1 access)",
    });
  const body = await readBody(event);
  const { pdfId, page, text, color, rects } = body;
  if (!pdfId || !page || !text || !rects) {
    throw createError({ statusCode: 400, message: "Missing required fields" });
  }
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO highlights (id, pdf_id, page, text, color, rects) VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, pdfId, page, text, color ?? "#FFFF00", JSON.stringify(rects))
    .run();
  return { id };
});
