/**
 * Singleton composable for pdfjs-dist.
 * Ensures only ONE instance of pdfjs-dist is ever loaded in the browser,
 * preventing "can't access private field" errors caused by dual module instances.
 * Dynamic import keeps it client-only so Node/SSR never sees it.
 *
 * The workerSrc uses a URL relative to this module so the worker binary
 * always matches the exact pdfjs-dist version installed in node_modules,
 * avoiding the "can't access private field or method: object is not the
 * right class" error that occurs when the worker and main thread use
 * different pdfjs versions.
 */
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function usePdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((lib) => {
      // Point the worker at the exact same pdfjs-dist installation that
      // was imported above.  Using a module-relative URL guarantees version
      // parity between the main-thread library and the worker.
      lib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).href;
      return lib;
    });
  }
  return pdfjsPromise;
}
