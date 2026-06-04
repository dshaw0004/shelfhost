export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env;
  if (!env)
    throw createError({
      statusCode: 503,
      message:
        "Database not available (run with wrangler dev for local D1 access)",
    });
  const body = await readBody(event);
  const { pdfId, page, label } = body;
  if (!pdfId || !page)
    throw createError({ statusCode: 400, message: "pdfId and page required" });
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT OR REPLACE INTO bookmarks (id, pdf_id, page, label) VALUES (?, ?, ?, ?)`,
  )
    .bind(id, pdfId, page, label ?? null)
    .run();
  return { id };
});
