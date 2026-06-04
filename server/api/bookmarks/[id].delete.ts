export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env;
  if (!env)
    throw createError({
      statusCode: 503,
      message:
        "Database not available (run with wrangler dev for local D1 access)",
    });
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });
  await env.DB.prepare(`DELETE FROM bookmarks WHERE id = ?`).bind(id).run();
  return { ok: true };
});
