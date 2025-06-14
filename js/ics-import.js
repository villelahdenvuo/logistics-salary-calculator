/**
 * ICS Import Module
 * Handles importing and processing ICS calendar files with CORS fallback
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
 * Fetches ICS data from a URL with automatic CORS proxy fallback
 * @param {string} url - The ICS file URL to fetch
 * @returns {Promise<{data: string, usedProxy: boolean}>} The ICS data and whether proxy was used
 */
export async function fetchIcsData(url) {
	if (!url || !url.trim()) {
		throw new Error("URL cannot be empty");
	}

	const trimmedUrl = url.trim();
	let response;
	let icsData;
	let usedProxy = false;

	// Check if this host should always use CORS proxy
	if (shouldUseCorsProxy(trimmedUrl)) {
		console.log("Host is in CORS proxy list, using proxy directly");

		const proxyUrl = `https://api.cors.lol/?url=${encodeURIComponent(trimmedUrl)}`;

		try {
			response = await fetch(proxyUrl);

			if (!response.ok) {
				throw new Error(`Proxy HTTP error! status: ${response.status}`);
			}

			icsData = await response.text();
			usedProxy = true;
		} catch (proxyError) {
			throw new Error(`CORS proxy failed: ${proxyError.message}`);
		}
	} else {
		// Try direct fetch first for other hosts
		try {
			response = await fetch(trimmedUrl);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			icsData = await response.text();
		} catch (directFetchError) {
			console.log("Direct fetch failed, trying CORS proxy:", directFetchError.message);

			// Retry with CORS proxy
			const proxyUrl = `https://api.cors.lol/?url=${encodeURIComponent(trimmedUrl)}`;

			try {
				response = await fetch(proxyUrl);

				if (!response.ok) {
					throw new Error(`Proxy HTTP error! status: ${response.status}`);
				}

				icsData = await response.text();
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

/**
 * Shows error message in the ICS results container
 * @param {HTMLElement} resultsContainer - The results container element
 * @param {string} message - Error message to display
 */
export function showIcsError(resultsContainer, message) {
	resultsContainer.innerHTML = `<div class="error-message">${message}</div>`;
	resultsContainer.classList.add("active");
}

/**
 * Shows success message in the ICS results container
 * @param {HTMLElement} resultsContainer - The results container element
 * @param {string} message - Success message to display
 */
export function showIcsSuccess(resultsContainer, message) {
	resultsContainer.innerHTML = `<div class="success-message">${message}</div>`;
	resultsContainer.classList.add("active");
}

/**
 * Displays parsed ICS data in a weekly view
 * @param {HTMLElement} resultsContainer - The results container element
 * @param {string} data - Raw ICS data to parse and display
 */
export function displayIcsData(resultsContainer, data) {
	console.log("🚀 Starting displayIcsData...");
	console.log("🚀 Data length:", data?.length || 0);

	const successMessage = resultsContainer.querySelector(".success-message");
	if (successMessage) {
		try {
			console.log("🚀 Beginning ICS parsing...");
			// Parse the ICS data
			const shifts = parseIcsData(data);
			console.log("🚀 Parsed shifts:", shifts);

			console.log("🚀 Grouping shifts by week...");
			const weeklyShifts = groupShiftsByWeek(shifts);
			console.log("🚀 Weekly shifts:", weeklyShifts);

			// Store shifts globally for other modules to access
			setGlobalShifts(shifts);
			console.log("🚀 Stored shifts globally");

			// Create and display the weekly view
			console.log("🚀 Creating weekly view...");
			const weeklyView = createWeeklyView(weeklyShifts);

			successMessage.innerHTML += `
				<div style="margin-top: 15px;">
					<strong>Parsed Shifts (${shifts.length} total):</strong>
				</div>
			`;
			successMessage.appendChild(weeklyView);
			console.log("✅ Weekly view added to DOM");
		} catch (error) {
			console.error("❌ Error parsing ICS data:", error);
			console.error("❌ Error stack:", error.stack);
			successMessage.innerHTML += `
				<div style="margin-top: 10px; color: #e74c3c;">
					<strong>Error parsing ICS data:</strong> ${error.message}
				</div>
			`;
		}
	} else {
		console.log("❌ No success message element found");
	}
}

/**
 * Initializes ICS import functionality for the given DOM elements
 * @param {HTMLInputElement} urlInput - The URL input element
 * @param {HTMLButtonElement} fetchButton - The fetch button element
 * @param {HTMLElement} resultsContainer - The results container element
 * @param {object} storageHandler - Storage handler object with save/load/clear methods (optional)
 */
export function initializeIcsImport(
	urlInput,
	fetchButton,
	resultsContainer,
	storageHandler = null,
) {
	if (!urlInput || !fetchButton || !resultsContainer) {
		console.error("ICS import initialization failed: missing required DOM elements");
		return;
	}

	fetchButton.addEventListener("click", async () => {
		const icsUrl = urlInput.value.trim();

		if (!icsUrl) {
			showIcsError(resultsContainer, "Please enter a valid ICS file URL");
			return;
		}

		try {
			fetchButton.disabled = true;
			fetchButton.textContent = "Fetching...";

			// Save URL to storage if handler is provided
			if (storageHandler) {
				storageHandler.save();
			}

			const result = await fetchIcsData(icsUrl);

			// Update button text if proxy was used
			if (result.usedProxy) {
				fetchButton.textContent = "Retrying with proxy...";
			}

			const successMessage = result.usedProxy
				? "ICS file fetched successfully via CORS proxy!"
				: "ICS file fetched successfully!";

			showIcsSuccess(resultsContainer, successMessage);
			displayIcsData(resultsContainer, result.data);
		} catch (error) {
			console.error("Error fetching ICS file:", error);
			showIcsError(resultsContainer, `Failed to fetch ICS file: ${error.message}`);
		} finally {
			fetchButton.disabled = false;
			fetchButton.textContent = "Fetch ICS Data";
		}
	});

	// Return utility methods for external control
	return {
		getUrl: () => urlInput.value.trim(),
		setUrl: (url) => {
			urlInput.value = url;
			if (storageHandler) {
				storageHandler.save();
			}
		},
		clearUrl: () => {
			urlInput.value = "";
			if (storageHandler) {
				storageHandler.clear();
			}
		},
	};
}

/**
 * Parses ICS data into an array of shift objects
 * @param {string} icsData - Raw ICS file content
 * @returns {Array} Array of shift objects with description, start, end, and isEnabled properties
 */
export function parseIcsData(icsData) {
	console.log("🔍 Starting ICS parsing...");
	console.log("📄 ICS data length:", icsData.length);
	console.log("📄 First 500 characters:", icsData.substring(0, 500));

	const shifts = [];
	const lines = icsData.split("\n").map((line) => line.trim());
	console.log("📝 Total lines:", lines.length);

	let currentEvent = null;
	let eventCount = 0;
	let validEventCount = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line === "BEGIN:VEVENT") {
			eventCount++;
			console.log(`📅 Found VEVENT #${eventCount} at line ${i + 1}`);
			currentEvent = {
				description: "",
				start: null,
				end: null,
				isEnabled: true,
			};
		} else if (line === "END:VEVENT" && currentEvent) {
			console.log(`✅ End of VEVENT #${eventCount}:`, {
				description: currentEvent.description,
				start: currentEvent.start,
				end: currentEvent.end,
				hasStart: !!currentEvent.start,
				hasEnd: !!currentEvent.end,
			});

			if (currentEvent.start && currentEvent.end) {
				validEventCount++;
				shifts.push(currentEvent);
				console.log(`✅ Added valid shift #${validEventCount}`);
			} else {
				console.log(`❌ Skipped invalid event (missing start or end time)`);
			}
			currentEvent = null;
		} else if (currentEvent) {
			if (line.startsWith("SUMMARY:")) {
				currentEvent.description = line.substring(8);
				console.log(`📝 Found SUMMARY: "${currentEvent.description}"`);
			} else if (line.startsWith("DTSTART:") || line.startsWith("DTSTART;")) {
				const dateTimeStr = line.includes(":") ? line.substring(line.indexOf(":") + 1) : "";
				console.log(`🕐 Found DTSTART: "${dateTimeStr}" (full line: "${line}")`);
				currentEvent.start = parseIcsDateTime(dateTimeStr);
				console.log(`🕐 Parsed start time:`, currentEvent.start);
			} else if (line.startsWith("DTEND:") || line.startsWith("DTEND;")) {
				const dateTimeStr = line.includes(":") ? line.substring(line.indexOf(":") + 1) : "";
				console.log(`🕕 Found DTEND: "${dateTimeStr}" (full line: "${line}")`);
				currentEvent.end = parseIcsDateTime(dateTimeStr);
				console.log(`🕕 Parsed end time:`, currentEvent.end);
			}
		}
	}

	console.log("📊 Parsing summary:");
	console.log(`   Total events found: ${eventCount}`);
	console.log(`   Valid events: ${validEventCount}`);
	console.log(`   Final shifts array length: ${shifts.length}`);

	const sortedShifts = shifts.sort((a, b) => a.start - b.start);
	console.log("✅ Parsing complete, returning sorted shifts");

	return sortedShifts;
}

/**
 * Parses ICS datetime string to JavaScript Date object
 * @param {string} icsDateTime - ICS datetime string (YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ)
 * @returns {Date} Parsed Date object
 */
function parseIcsDateTime(icsDateTime) {
	console.log(`🔍 Parsing datetime: "${icsDateTime}"`);

	if (!icsDateTime) {
		console.log("❌ Empty datetime string");
		return new Date();
	}

	// Remove timezone suffix if present
	const dateTimeStr = icsDateTime.replace(/[TZ]/g, "");
	console.log(`🔍 Cleaned datetime: "${dateTimeStr}"`);

	if (dateTimeStr.length >= 8) {
		const year = parseInt(dateTimeStr.substring(0, 4));
		const month = parseInt(dateTimeStr.substring(4, 6)) - 1; // Month is 0-indexed
		const day = parseInt(dateTimeStr.substring(6, 8));

		let hour = 0,
			minute = 0,
			second = 0;

		if (dateTimeStr.length >= 14) {
			hour = parseInt(dateTimeStr.substring(8, 10));
			minute = parseInt(dateTimeStr.substring(10, 12));
			second = parseInt(dateTimeStr.substring(12, 14));
		}

		const parsedDate = new Date(year, month, day, hour, minute, second);
		console.log(`✅ Parsed as: ${parsedDate.toISOString()} (${parsedDate.toString()})`);
		return parsedDate;
	}

	console.log("❌ Invalid datetime format, returning current date");
	return new Date();
}

/**
 * Gets the ISO week number for a given date
 * @param {Date} date - The date to get week number for
 * @returns {number} ISO week number
 */
function getWeekNumber(date) {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * Groups shifts by year and week number
 * @param {Array} shifts - Array of shift objects
 * @returns {Object} Object with year-week keys and shift arrays as values
 */
export function groupShiftsByWeek(shifts) {
	console.log("📊 Grouping shifts by week...");
	console.log("📊 Input shifts:", shifts.length);

	const grouped = {};

	shifts.forEach((shift, index) => {
		const year = shift.start.getFullYear();
		const week = getWeekNumber(shift.start);
		const key = `${year}-W${week.toString().padStart(2, "0")}`;

		console.log(`📅 Shift ${index + 1}: ${shift.description} -> Week ${key}`);

		if (!grouped[key]) {
			grouped[key] = {
				year,
				week,
				shifts: [],
			};
			console.log(`📅 Created new week group: ${key}`);
		}

		grouped[key].shifts.push(shift);
	});

	console.log("📊 Grouping complete:");
	Object.keys(grouped).forEach((key) => {
		console.log(`   ${key}: ${grouped[key].shifts.length} shifts`);
	});

	return grouped;
}

/**
 * Creates a weekly view component for displaying shifts
 * @param {Object} weeklyShifts - Grouped shifts by week
 * @returns {HTMLElement} The weekly view container element
 */
export function createWeeklyView(weeklyShifts) {
	console.log("🎨 Creating weekly view...");
	console.log("🎨 Weekly shifts data:", weeklyShifts);

	const container = document.createElement("div");
	container.className = "weekly-view";

	const weekKeys = Object.keys(weeklyShifts).sort();
	console.log("🎨 Week keys:", weekKeys);

	if (weekKeys.length === 0) {
		console.log("❌ No weeks found, showing empty message");
		container.innerHTML = '<p class="no-shifts">No shifts found in the ICS file.</p>';
		return container;
	}

	weekKeys.forEach((weekKey) => {
		console.log(`🎨 Creating week element for: ${weekKey}`);
		const weekData = weeklyShifts[weekKey];
		const weekElement = createWeekElement(weekKey, weekData);
		container.appendChild(weekElement);
	});

	console.log("✅ Weekly view created successfully");
	return container;
}

/**
 * Creates a single week element with day blocks
 * @param {string} weekKey - Week identifier (YYYY-WWW)
 * @param {Object} weekData - Week data containing shifts
 * @returns {HTMLElement} Week element
 */
function createWeekElement(weekKey, weekData) {
	const weekDiv = document.createElement("div");
	weekDiv.className = "week-row";

	// Week header
	const header = document.createElement("div");
	header.className = "week-header";
	header.textContent = `${weekKey} (${weekData.year})`;
	weekDiv.appendChild(header);

	// Days container
	const daysContainer = document.createElement("div");
	daysContainer.className = "week-days";

	// Get Monday of this week
	const mondayDate = getMondayOfWeek(weekData.year, weekData.week);

	// Create 7 day blocks (Monday to Sunday)
	for (let i = 0; i < 7; i++) {
		const dayDate = new Date(mondayDate);
		dayDate.setDate(mondayDate.getDate() + i);

		const dayElement = createDayElement(dayDate, weekData.shifts);
		daysContainer.appendChild(dayElement);
	}

	weekDiv.appendChild(daysContainer);
	return weekDiv;
}

/**
 * Gets the Monday date for a given ISO week
 * @param {number} year - Year
 * @param {number} week - ISO week number
 * @returns {Date} Monday date of the week
 */
function getMondayOfWeek(year, week) {
	const jan4 = new Date(year, 0, 4);
	const daysToMonday = 1 - (jan4.getDay() || 7);
	const firstMonday = new Date(jan4);
	firstMonday.setDate(jan4.getDate() + daysToMonday);

	const targetMonday = new Date(firstMonday);
	targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);

	return targetMonday;
}

/**
 * Creates a day element with shifts
 * @param {Date} date - The date for this day
 * @param {Array} shifts - All shifts for the week
 * @returns {HTMLElement} Day element
 */
function createDayElement(date, shifts) {
	const dayDiv = document.createElement("div");
	dayDiv.className = "day-block";

	// Day header
	const dayHeader = document.createElement("div");
	dayHeader.className = "day-header";
	const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const dayName = dayNames[(date.getDay() + 6) % 7]; // Convert Sunday=0 to Monday=0
	dayHeader.textContent = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;
	dayDiv.appendChild(dayHeader);

	// Find shifts for this day
	const dayShifts = shifts.filter((shift) => {
		const shiftDate = new Date(shift.start);
		return (
			shiftDate.getDate() === date.getDate() &&
			shiftDate.getMonth() === date.getMonth() &&
			shiftDate.getFullYear() === date.getFullYear()
		);
	});

	// Add shift blocks
	const shiftsContainer = document.createElement("div");
	shiftsContainer.className = "day-shifts";

	if (dayShifts.length === 0) {
		shiftsContainer.innerHTML = '<div class="no-shift">-</div>';
	} else {
		dayShifts.forEach((shift) => {
			const shiftElement = createShiftElement(shift);
			shiftsContainer.appendChild(shiftElement);
		});
	}

	dayDiv.appendChild(shiftsContainer);
	return dayDiv;
}

/**
 * Creates a shift element
 * @param {Object} shift - Shift object
 * @returns {HTMLElement} Shift element
 */
function createShiftElement(shift) {
	const shiftDiv = document.createElement("div");
	shiftDiv.className = `shift-block ${shift.isEnabled ? "enabled" : "disabled"}`;

	const startTime = shift.start.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
	const endTime = shift.end.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	shiftDiv.innerHTML = `
		<div class="shift-time">${startTime} - ${endTime}</div>
		<div class="shift-description">${shift.description}</div>
		<input type="checkbox" class="shift-toggle" ${shift.isEnabled ? "checked" : ""}>
	`;

	// Add toggle functionality
	const checkbox = shiftDiv.querySelector(".shift-toggle");
	checkbox.addEventListener("change", () => {
		shift.isEnabled = checkbox.checked;
		shiftDiv.className = `shift-block ${shift.isEnabled ? "enabled" : "disabled"}`;
	});

	return shiftDiv;
}

/**
 * Gets all enabled shifts from the weekly view
 * @param {HTMLElement} weeklyViewContainer - The weekly view container
 * @returns {Array} Array of enabled shift objects
 */
export function getEnabledShifts(weeklyViewContainer) {
	const enabledShifts = [];
	const shiftElements = weeklyViewContainer.querySelectorAll(".shift-block.enabled");

	shiftElements.forEach((shiftElement) => {
		// Extract shift data from the DOM element
		// This is a simplified approach - in a real app you'd store the data reference
		const timeText = shiftElement.querySelector(".shift-time").textContent;
		const description = shiftElement.querySelector(".shift-description").textContent;

		// Note: This is a simplified implementation
		// In production, you'd want to store the actual shift objects
		// and reference them from the DOM elements
		enabledShifts.push({
			description,
			timeText,
			isEnabled: true,
		});
	});

	return enabledShifts;
}

/**
 * Stores the parsed shifts globally for access by other modules
 */
let globalShifts = [];

/**
 * Sets the global shifts array
 * @param {Array} shifts - Array of shift objects
 */
export function setGlobalShifts(shifts) {
	globalShifts = shifts;
}

/**
 * Gets all shifts (both enabled and disabled)
 * @returns {Array} Array of all shift objects
 */
export function getAllShifts() {
	return globalShifts;
}

/**
 * Gets only the enabled shifts
 * @returns {Array} Array of enabled shift objects
 */
export function getGlobalEnabledShifts() {
	return globalShifts.filter((shift) => shift.isEnabled);
}
