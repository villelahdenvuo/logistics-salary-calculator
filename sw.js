const CACHE_NAME = "logistics-salary-calculator-v7";
const urlsToCache = [
	"./",
	"./index.html",
	"./manifest.json",
	"./css/style.css",
	// Core JavaScript files
	"./js/calculator.js",
	"./js/calculator-engine.js",
	"./js/config.js",
	"./js/config-manager.js",
	"./js/storage.js",
	"./js/ics-event-handler.js",
	"./js/ics-fetcher.js",
	"./js/ics-handler.js",
	"./js/ics-parser.js",
	"./js/ics-state-manager.js",
	// Component files
	"./js/components/BreakdownItem.js",
	"./js/components/CalendarImportTab.js",
	"./js/components/Component.js",
	"./js/components/ConfigPanel.js",
	"./js/components/ConfigToggle.js",
	"./js/components/DayBlock.js",
	"./js/components/EditableConfigPanel.js",
	"./js/components/EventDelegator.js",
	"./js/components/HourBreakdown.js",
	"./js/components/HourlyBreakdownContainer.js",
	"./js/components/IcsImportForm.js",
	"./js/components/IcsImportSection.js",
	"./js/components/IcsResults.js",
	"./js/components/OverallSummary.js",
	"./js/components/Results.js",
	"./js/components/ResultsSummary.js",
	"./js/components/SalarySummary.js",
	"./js/components/ShiftBlock.js",
	"./js/components/SingleShiftTab.js",
	"./js/components/Tabs.js",
	"./js/components/WeekRow.js",
	"./js/components/WeeklySummary.js",
	"./js/components/WeeklyView.js",
	// Icons and assets
	"./icons/favicon.ico",
	"./icons/icon-192x192.svg",
	"./icons/icon-512x512.svg",
];

// Install the service worker and cache assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log("Opened cache:", CACHE_NAME);
			return cache.addAll(urlsToCache);
		}),
	);
	self.skipWaiting(); // Add this line
});

// Add this event listener to claim clients and clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		self.clients.claim().then(() =>
			// Clean up old caches
			caches.keys().then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME) // Corrected filter
						.map((cacheName) => {
							console.log("Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}),
				),
			),
		),
	);
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
