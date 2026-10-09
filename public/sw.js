/* Agency HR service worker.
 *
 * Caches the app shell only (HTML, JS, CSS, images, fonts) so the app opens
 * quickly and shows its own screen on a weak connection.
 *
 * It deliberately never touches API traffic: payslips, time records and
 * employee data are personal information and must not be stored on the device
 * by the cache, and a stale API answer is worse than an error here.
 */
const VERSION = "v1";
const SHELL_CACHE = `agencyhr-shell-${VERSION}`;
const ASSET_CACHE = `agencyhr-assets-${VERSION}`;

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.add(new Request("/", { cache: "reload" })))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter(
                            (key) =>
                                key.startsWith("agencyhr-") &&
                                key !== SHELL_CACHE &&
                                key !== ASSET_CACHE,
                        )
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    // Page loads: network first so a new deploy is picked up immediately,
    // falling back to the cached shell when offline.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches
                        .open(SHELL_CACHE)
                        .then((cache) => cache.put("/", copy));
                    return response;
                })
                .catch(() => caches.match("/")),
        );
        return;
    }

    // Build output is content-hashed, so cache-first is safe.
    if (url.pathname.startsWith("/assets/")) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((response) => {
                        if (response.ok) {
                            const copy = response.clone();
                            caches
                                .open(ASSET_CACHE)
                                .then((cache) => cache.put(request, copy));
                        }
                        return response;
                    }),
            ),
        );
    }
});
