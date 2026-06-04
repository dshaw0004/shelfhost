export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env;
  if (!env)
    throw createError({
      statusCode: 503,
      message:
        "Database not available (run with wrangler dev for local D1 access)",
    });
  const pdfId = event.context.params?.id;
  if (!pdfId) throw createError({ statusCode: 400, message: "Missing pdfId" });
  const { page } = await readBody(event);
  await env.DB.prepare(
    `INSERT INTO reading_progress (pdf_id, page, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(pdf_id) DO UPDATE SET page = excluded.page, updated_at = excluded.updated_at`,
  )
    .bind(pdfId, page)
    .run();
  return { ok: true };
});
