import Component from "./Component.js";
import IcsImportSection from "./IcsImportSection.js";

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
			${IcsImportSection(props)}
		</div>
	`,
	);
}
