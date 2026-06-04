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
  const { results } = await env.DB.prepare(
    `SELECT * FROM highlights WHERE pdf_id = ? ORDER BY page, created_at`,
  )
    .bind(pdfId)
    .all();
  return results.map((h: any) => ({
    ...h,
    rects: JSON.parse(h.rects as string),
  }));
});
