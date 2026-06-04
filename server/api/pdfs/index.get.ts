export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env;
  if (!env)
    throw createError({
      statusCode: 503,
      message:
        "Database not available (run with wrangler dev for local D1 access)",
    });
  const { results } = await env.DB.prepare(
    `SELECT p.*, COALESCE(rp.page, 1) as current_page FROM pdfs p LEFT JOIN reading_progress rp ON p.id = rp.pdf_id ORDER BY p.created_at DESC`,
  ).all();
  return results;
});
