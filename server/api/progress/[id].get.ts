export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env;
  if (!env)
    throw createError({
      statusCode: 503,
      message:
        "Database not available (run with wrangler dev for local D1 access)",
    });
  const pdfId = getRouterParam(event, "id");
  if (!pdfId) throw createError({ statusCode: 400, message: "Missing pdfId" });
  const result = await env.DB.prepare(
    `SELECT page FROM reading_progress WHERE pdf_id = ?`,
  )
    .bind(pdfId)
    .first();
  return { page: result?.page ?? 1 };
});
