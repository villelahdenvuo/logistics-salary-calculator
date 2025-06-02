const CACHE_NAME = "logistics-salary-calculator-v4";
const urlsToCache = [
	"./",
	"./index.html",
	"./css/style.css",
	"./js/calculator.js",
	"./js/calculator-engine.js",
	"./js/config.js",
	"./js/config-manager.js",
	"./js/storage.js",
	"./js/components/BreakdownItem.js",
	"./js/components/Component.js",
	"./js/components/ConfigPanel.js",
	"./js/components/EditableConfigPanel.js",
	"./js/components/HourBreakdown.js",
	"./js/components/HourlyBreakdownContainer.js",
	"./js/components/Results.js",
	"./js/components/ResultsSummary.js",
	"./icons/icon-192x192.svg",
	"./icons/icon-512x512.svg",
];

// Install the service worker and cache assets
self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

// Helper function to check if a URL is cacheable
function isCacheableURL(url) {
	const urlObj = new URL(url);
	// Only cache HTTP and HTTPS requests
	return urlObj.protocol === "http:" || urlObj.protocol === "https:";
}

// Serve cached content when offline
self.addEventListener("fetch", (event) => {
	// Skip non-cacheable URLs like chrome-extension://
	if (!isCacheableURL(event.request.url)) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((response) => {
			// Cache hit - return the response from the cached version
			if (response) {
				return response;
			}

			// Not in cache - fetch from network
			return fetch(event.request).then((networkResponse) => {
				// Check if we received a valid response
				if (
					!networkResponse ||
					networkResponse.status !== 200 ||
					networkResponse.type !== "basic"
				) {
					return networkResponse;
				}

				// Clone the response
				const responseToCache = networkResponse.clone();

				// Add to cache for future use
				caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, responseToCache);
				});

				return networkResponse;
			});
		}),
	);
});
