/**
 * ICS Parser Module
 * Handles parsing ICS calendar data into shift objects
 */

/**
 * Parses ICS datetime string to JavaScript Date object
 * @param {string} icsDateTime - ICS datetime string
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
		// Normalize to the hour since shifts always start on the hour
		parsedDate.setMinutes(0, 0, 0);
		console.log(`✅ Parsed as: ${parsedDate.toISOString()} (${parsedDate.toString()})`);
		return parsedDate;
	}

	console.log("❌ Invalid datetime format, returning current date");
	return new Date();
}

/**
 * Parses a single VEVENT from ICS lines
 * @param {Array<string>} lines - Array of ICS lines
 * @param {number} startIndex - Starting index of the VEVENT
 * @returns {{event: object|null, nextIndex: number}} Parsed event and next line index
 */
function parseVEvent(lines, startIndex) {
	const currentEvent = {
		description: "",
		start: null,
		end: null,
		isEnabled: true,
	};

	let i = startIndex + 1; // Skip the BEGIN:VEVENT line

	while (i < lines.length) {
		const line = lines[i].trim();

		if (line === "END:VEVENT") {
			// Add a unique ID to each shift if we have valid start/end times
			if (currentEvent.start && currentEvent.end) {
				currentEvent.id = `shift-${currentEvent.start.getTime()}`;
				return { event: currentEvent, nextIndex: i + 1 };
			} else {
				console.log(`❌ Skipped invalid event (missing start or end time)`);
				return { event: null, nextIndex: i + 1 };
			}
		}

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

		i++;
	}

	// If we reach here, we didn't find END:VEVENT
	console.log(`❌ Reached end of file without finding END:VEVENT`);
	return { event: null, nextIndex: lines.length };
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

	let eventCount = 0;
	let validEventCount = 0;
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (line === "BEGIN:VEVENT") {
			eventCount++;
			console.log(`📅 Found VEVENT #${eventCount} at line ${i + 1}`);

			const { event, nextIndex } = parseVEvent(lines, i);

			if (event) {
				validEventCount++;
				shifts.push(event);
				console.log(`✅ Added valid shift #${validEventCount}`);
			}

			i = nextIndex;
		} else {
			i++;
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
