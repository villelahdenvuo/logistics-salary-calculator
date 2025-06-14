/**
 * ICS Fetcher Module
 * Handles network operations for fetching ICS files with CORS fallback
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
 * Fetches data directly from a URL
 * @param {string} url - The URL to fetch from
 * @returns {Promise<string>} The response text
 * @throws {Error} If the fetch fails
 */
async function fetchDirect(url) {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return await response.text();
}

/**
 * Fetches data via CORS proxy
 * @param {string} url - The URL to fetch from
 * @returns {Promise<string>} The response text
 * @throws {Error} If the proxy fetch fails
 */
async function fetchViaProxy(url) {
	const proxyUrl = `https://api.cors.lol/?url=${encodeURIComponent(url)}`;
	const response = await fetch(proxyUrl);

	if (!response.ok) {
		throw new Error(`Proxy HTTP error! status: ${response.status}`);
	}

	return await response.text();
}

/**
 * Fetches ICS data from a URL with automatic CORS proxy fallback
 * @param {string} url - The ICS file URL to fetch
 * @returns {Promise<{data: string, usedProxy: boolean}>} The ICS data and whether proxy was used
 * @throws {Error} If both direct and proxy fetch fail
 */
export async function fetchIcsData(url) {
	if (!url || !url.trim()) {
		throw new Error("URL cannot be empty");
	}

	const trimmedUrl = url.trim();
	let icsData;
	let usedProxy = false;

	// Check if this host should always use CORS proxy
	if (shouldUseCorsProxy(trimmedUrl)) {
		console.log("Host is in CORS proxy list, using proxy directly");

		try {
			icsData = await fetchViaProxy(trimmedUrl);
			usedProxy = true;
		} catch (proxyError) {
			throw new Error(`CORS proxy failed: ${proxyError.message}`);
		}
	} else {
		// Try direct fetch first for other hosts
		try {
			icsData = await fetchDirect(trimmedUrl);
		} catch (directFetchError) {
			console.log("Direct fetch failed, trying CORS proxy:", directFetchError.message);

			// Retry with CORS proxy
			try {
				icsData = await fetchViaProxy(trimmedUrl);
				usedProxy = true;
			} catch (proxyError) {
				// If both direct and proxy fail, throw the proxy error
				throw new Error(`Both direct fetch and proxy failed. Proxy error: ${proxyError.message}`);
			}
		}
	}

	return {
		data: icsData,
		usedProxy,
	};
}
