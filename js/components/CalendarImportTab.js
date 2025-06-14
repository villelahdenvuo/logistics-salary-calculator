import Component from "./Component.js";

/**
 * Calendar Import Tab component for importing shifts from calendar
 * @param {Object} props - Component properties
 * @returns {string} HTML string for the calendar import tab content
 */
export default function CalendarImportTab(props = {}) {
	return Component(
		props,
		`
		<div class="ics-import-section">
			<h2>
				Import Shifts from Calendar
				<a
					href="https://quinyx.helpdocs.io/l/en/article/y5dybyykbi-mobile-web-calendar"
					target="_blank"
					class="info-link"
					title="Learn more about calendar integration"
					>ℹ️</a
				>
			</h2>
			<div class="ics-form">
				<div class="form-group">
					<label for="ics-url">Calendar URL:</label>
					<input type="url" id="ics-url" placeholder="https://example.com/calendar.ics" />
				</div>
				<button id="fetch-ics-btn">Fetch Calendar Data</button>
				<div class="ics-results" id="ics-results">
					<!-- ICS data will be displayed here -->
				</div>
			</div>

			<div class="config-toggle">
				<button id="toggle-config-calendar">Edit Configuration Settings ▼</button>
				<div class="config-panel" id="config-panel-calendar">
					<!-- Configuration settings will be inserted here by JavaScript -->
				</div>
			</div>
		</div>
	`,
	);
}
