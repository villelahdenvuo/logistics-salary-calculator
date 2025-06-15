/**
 * ICS Fetcher Module
 * Handles network operations for fetching calendar files with CORS fallback
 */

import { corsProxyHosts } from "./config.js";

/**
 * Checks if a URL hostname is in the CORS proxy hosts list
 * @param {string} url - The URL to check
 * @returns {boolean} True if the host should use CORS proxy
 */
function shouldUseCorsProxy(url) {
	try {
		const urlObj = new URL(url);
		return corsProxyHosts.includes(urlObj.hostname);
	} catch (error) {
		console.warn("Invalid URL for CORS proxy check:", url, error.message);
		return false;
	}
}

/**
 * Fetches ICS data from a URL with automatic CORS proxy fallback and service worker caching
 * @param {string} url - The calendar file URL to fetch
 * @returns {Promise<{data: string, usedProxy: boolean, fromCache: boolean}>} The ICS data, whether proxy was used, and if served from cache
 * @throws {Error} If both direct and proxy fetch fail
 */
export async function fetchIcsData(url) {
	if (!url || !url.trim()) {
		throw new Error("URL cannot be empty");
	}

	const trimmedUrl = url.trim();
	let icsData;
	let usedProxy = false;
	let fromCache = false;

	// Check if this host should always use CORS proxy
	if (shouldUseCorsProxy(trimmedUrl)) {
		console.log("Host is in CORS proxy list, using proxy directly");

		try {
			const response = await fetch(
				`https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedUrl)}`,
			);

			if (!response.ok) {
				throw new Error(`Proxy HTTP error! status: ${response.status}`);
			}

			icsData = await response.text();
			usedProxy = true;

			// Check if response came from service worker cache
			fromCache = response.headers.get("sw-cache-timestamp") !== null;
		} catch (proxyError) {
			throw new Error(`CORS proxy failed: ${proxyError.message}`);
		}
	} else {
		// Try direct fetch first for other hosts
		try {
			const response = await fetch(trimmedUrl);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			icsData = await response.text();
			fromCache = response.headers.get("sw-cache-timestamp") !== null;
		} catch (directFetchError) {
			console.log("Direct fetch failed, trying CORS proxy:", directFetchError.message);

			// Retry with CORS proxy
			try {
				const response = await fetch(
					`https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedUrl)}`,
				);

				if (!response.ok) {
					throw new Error(`Proxy HTTP error! status: ${response.status}`);
				}

				icsData = await response.text();
				usedProxy = true;
				fromCache = response.headers.get("sw-cache-timestamp") !== null;
			} catch (proxyError) {
				// If both direct and proxy fail, throw the proxy error
				throw new Error(`Both direct fetch and proxy failed. Proxy error: ${proxyError.message}`);
			}
		}
	}

	// Log cache status for debugging
	if (fromCache) {
		console.log("ICS data served from cache");
	}

	return {
		data: icsData,
		usedProxy,
		fromCache,
	};
}
