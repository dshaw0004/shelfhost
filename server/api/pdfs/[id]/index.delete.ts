export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;
  const id = event.context.params?.id;
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });
  const pdf = await env.DB.prepare(`SELECT r2_key FROM pdfs WHERE id = ?`)
    .bind(id)
    .first();
  if (!pdf) throw createError({ statusCode: 404, message: "PDF not found" });
  await env.BUCKET.delete(pdf.r2_key as string);
  // Delete related records first (manual cascade for D1 compatibility)
  await env.DB.prepare(`DELETE FROM bookmarks WHERE pdf_id = ?`).bind(id).run();
  await env.DB.prepare(`DELETE FROM highlights WHERE pdf_id = ?`)
    .bind(id)
    .run();
  await env.DB.prepare(`DELETE FROM reading_progress WHERE pdf_id = ?`)
    .bind(id)
    .run();
  await env.DB.prepare(`DELETE FROM pdfs WHERE id = ?`).bind(id).run();
  return { ok: true };
});
