/* Runs the Ark compiler + interpreter in a dedicated worker so the
   editor stays responsive. One WASM module does both stages: the Ark
   frontend (check + gen) and the Yaegi interpreter executing the
   generated Go. A fresh interpreter runs per run.

   The 45 MB wasm is cached in Cache Storage. Every boot does a cheap
   HEAD request; if the server file changed (size or Last-Modified),
   the cache is refreshed. Otherwise the download is skipped entirely. */
self.postMessage({ type: 'boot', stage: 'fetching compiler...' });

// The wasm's Stdin reader invokes this the first time a program reads
// input; relay the request so the UI can show the input row.
self.arkOnInput = () => self.postMessage({ type: 'input' });

const CACHE = 'ark-wasm-cache-v1';
const WASM_URL = './ark.wasm';

async function cachedWasmBytes(onProgress) {
  const head = await fetch(WASM_URL, { method: 'HEAD' });
  if (!head.ok) throw new Error('Could not reach ark.wasm (' + head.status + ')');
  const serverMeta = JSON.stringify({
    len: head.headers.get('Content-Length'),
    mod: head.headers.get('Last-Modified'),
    etag: head.headers.get('ETag'),
  });

  try {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(WASM_URL);
    if (hit) {
      const storedMeta = hit.headers.get('X-Ark-Meta');
      if (storedMeta === serverMeta) {
        onProgress({ cached: true });
        return await hit.arrayBuffer();
      }
    }

    // stale or missing: stream the full download with progress
    const resp = await fetch(WASM_URL);
    if (!resp.ok) throw new Error('Could not load ark.wasm (' + resp.status + ')');
    const total = Number(resp.headers.get('Content-Length')) || 0;
    let bytes;
    if (resp.body && total) {
      const reader = resp.body.getReader();
      const chunks = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        onProgress({ loaded, total });
      }
      const out = new Uint8Array(loaded);
      let off = 0;
      for (const c of chunks) { out.set(c, off); off += c.length; }
      bytes = out.buffer;
    } else {
      bytes = await resp.arrayBuffer();
    }

    // store with the metadata header for next boot's comparison
    const store = new Response(bytes, {
      headers: { 'X-Ark-Meta': serverMeta, 'Content-Type': 'application/wasm' },
    });
    await cache.put(WASM_URL, store);
    return bytes;
  } catch (e) {
    // Cache Storage unavailable (file:// or private mode): plain fetch
    const resp = await fetch(WASM_URL);
    if (!resp.ok) throw new Error('Could not load ark.wasm (' + resp.status + ')');
    return await resp.arrayBuffer();
  }
}

(async function boot() {
  try {
    importScripts('./wasm_exec.js');
    const go = new Go();
    const bytes = await cachedWasmBytes((m) => self.postMessage({ type: 'boot', ...m }));
    self.postMessage({ type: 'boot', stage: 'starting compiler...' });
    const { instance } = await WebAssembly.instantiate(bytes, go.importObject);
    // The Go program intentionally stays alive, exposing arkRun to this worker.
    go.run(instance).catch((error) => {
      self.postMessage({ type: 'fatal', error: String(error) });
    });
  } catch (error) {
    self.postMessage({ type: 'fatal', error: String(error) });
  }
})();

self.addEventListener('message', (event) => {
  const message = event.data || {};
  if (message.type === 'inputLine') {
    // The terminal input row submitted a line; feed the blocked Read.
    if (typeof self.arkInput === 'function') self.arkInput(String(message.text || ''));
    return;
  }
  if (message.type === 'format') {
    // arkFormat: the real Ark formatter, exposed by the wasm.
    if (typeof self.arkFormat !== 'function') {
      self.postMessage({ type: 'formatted', id: message.id, ok: false, error: 'not ready' });
      return;
    }
    try {
      const r = self.arkFormat(String(message.code || ''));
      const f = (o, k) => (typeof o.get === 'function') ? o.get(k) : o[k];
      self.postMessage({
        type: 'formatted', id: message.id,
        ok: String(f(r, 'ok')) === 'true',
        text: String(f(r, 'text')),
        error: String(f(r, 'error')),
      });
    } catch (e) {
      self.postMessage({ type: 'formatted', id: message.id, ok: false, error: String(e) });
    }
    return;
  }
  if (message.type !== 'run') return;

  if (typeof self.arkRun !== 'function') {
    self.postMessage({ type: 'result', success: false, error: 'Ark runtime is not ready.' });
    return;
  }

  try {
    // arkRun returns a Promise (the program runs in a goroutine so it
    // can block on stdin without freezing the worker).
    Promise.resolve(self.arkRun(message.code || ''))
      .then((result) => self.postMessage({ type: 'result', ...result }))
      .catch((error) => self.postMessage({ type: 'result', success: false, error: String(error) }));
  } catch (error) {
    self.postMessage({ type: 'result', success: false, error: String(error) });
  }
});
