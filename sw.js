const CACHE_NAME = "logistics-salary-calculator-v9";
const ICS_CACHE_NAME = "ics-data-cache-v1";
const ICS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

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
						.filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== ICS_CACHE_NAME) // Keep both app cache and ICS cache
						.map((cacheName) => {
							console.log("Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}),
				),
			),
		),
	);
});

// Helper function to check if a URL is an ICS request
function isIcsRequest(url) {
	try {
		const urlObj = new URL(url);
		// Check if it's a CORS proxy request for ICS data
		return (
			urlObj.hostname === "api.allorigins.win" ||
			urlObj.pathname.endsWith(".ics") ||
			urlObj.search.includes(".ics")
		);
	} catch {
		return false;
	}
}

// Helper function to create cache key for ICS data
function createIcsCacheKey(originalUrl) {
	// Extract the original URL from proxy requests
	if (originalUrl.includes("api.allorigins.win")) {
		const urlParam = new URL(originalUrl).searchParams.get("url");
		return `ics-${btoa(urlParam || originalUrl)}`; // Base64 encode for safe key
	}
	return `ics-${btoa(originalUrl)}`;
}

// Helper function to check if cached ICS data is still valid
async function isIcsCacheValid(cache, cacheKey) {
	const cachedResponse = await cache.match(cacheKey);
	if (!cachedResponse) {
		return false;
	}

	const cacheTimestamp = cachedResponse.headers.get("sw-cache-timestamp");
	if (!cacheTimestamp) {
		return false;
	}

	const now = Date.now();
	const cacheAge = now - parseInt(cacheTimestamp);
	return cacheAge < ICS_CACHE_DURATION;
}

// Helper function to cache ICS response with timestamp
async function cacheIcsResponse(cache, cacheKey, response) {
	const responseClone = response.clone();
	const body = await responseClone.text();

	// Create new response with cache timestamp header
	const cachedResponse = new Response(body, {
		status: response.status,
		statusText: response.statusText,
		headers: {
			...Object.fromEntries(response.headers.entries()),
			"sw-cache-timestamp": Date.now().toString(),
			"content-type": "text/calendar; charset=utf-8",
		},
	});

	await cache.put(cacheKey, cachedResponse);
}

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

	// Handle ICS requests with special caching logic
	if (isIcsRequest(event.request.url)) {
		event.respondWith(handleIcsRequest(event.request));
		return;
	}

	// Handle regular requests with standard caching
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

// Handle ICS requests with time-based caching
async function handleIcsRequest(request) {
	const cacheKey = createIcsCacheKey(request.url);

	try {
		const icsCache = await caches.open(ICS_CACHE_NAME);

		// Check if we have valid cached data
		if (await isIcsCacheValid(icsCache, cacheKey)) {
			console.log("Serving ICS data from cache:", cacheKey);
			const cachedResponse = await icsCache.match(cacheKey);
			return cachedResponse;
		}

		// Cache miss or expired - fetch from network
		console.log("Fetching fresh ICS data:", request.url);
		const networkResponse = await fetch(request);

		if (networkResponse.ok) {
			// Cache the fresh response
			await cacheIcsResponse(icsCache, cacheKey, networkResponse);
			console.log("Cached fresh ICS data:", cacheKey);
		}

		return networkResponse;
	} catch (error) {
		console.error("Error handling ICS request:", error);

		// Try to serve stale cache as fallback
		try {
			const icsCache = await caches.open(ICS_CACHE_NAME);
			const staleResponse = await icsCache.match(cacheKey);
			if (staleResponse) {
				console.log("Serving stale ICS cache as fallback:", cacheKey);
				return staleResponse;
			}
		} catch (fallbackError) {
			console.error("Fallback cache lookup failed:", fallbackError);
		}

		// If all else fails, try the network request without caching
		return fetch(request);
	}
}

// Helper function to clean up expired ICS cache entries
async function cleanupExpiredIcsCache() {
	try {
		const icsCache = await caches.open(ICS_CACHE_NAME);
		const requests = await icsCache.keys();

		for (const request of requests) {
			const response = await icsCache.match(request);
			if (response) {
				const cacheTimestamp = response.headers.get("sw-cache-timestamp");
				if (cacheTimestamp) {
					const cacheAge = Date.now() - parseInt(cacheTimestamp);
					if (cacheAge >= ICS_CACHE_DURATION) {
						console.log("Cleaning up expired ICS cache entry:", request.url);
						await icsCache.delete(request);
					}
				}
			}
		}
	} catch (error) {
		console.error("Error cleaning up expired ICS cache:", error);
	}
}

// Clean up expired cache entries periodically
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "CLEANUP_CACHE") {
		cleanupExpiredIcsCache();
	} else if (event.data && event.data.type === "CLEAR_ICS_CACHE") {
		caches
			.delete(ICS_CACHE_NAME)
			.then(() => {
				console.log("ICS cache cleared manually");
			})
			.catch((error) => {
				console.error("Error clearing ICS cache:", error);
			});
	}
});
