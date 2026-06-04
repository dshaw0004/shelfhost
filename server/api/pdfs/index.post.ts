export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;
  const form = await readMultipartFormData(event);
  const file = form?.find((f) => f.name === "file");
  if (!file || file.type !== "application/pdf") {
    throw createError({
      statusCode: 400,
      message: "Invalid file. Must be a PDF.",
    });
  }
  const id = crypto.randomUUID();
  const r2Key = `pdfs/${id}.pdf`;
  const buffer = file.data.buffer.slice(
    file.data.byteOffset,
    file.data.byteOffset + file.data.byteLength,
  );
  await env.BUCKET.put(r2Key, buffer, {
    httpMetadata: { contentType: "application/pdf" },
  });
  await env.DB.prepare(
    `INSERT INTO pdfs (id, name, r2_key, size) VALUES (?, ?, ?, ?)`,
  )
    .bind(id, file.filename ?? "Untitled.pdf", r2Key, file.data.length)
    .run();
  return { id, name: file.filename };
});
