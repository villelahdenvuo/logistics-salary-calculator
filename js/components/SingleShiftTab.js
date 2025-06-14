import Component from "./Component.js";

/**
 * Single Shift Tab component for manual shift entry
 * @param {Object} props - Component properties
 * @returns {string} HTML string for the single shift tab content
 */
export default function SingleShiftTab(props = {}) {
	return Component(
		props,
		`
		<div class="calculator-form">
			<div class="input-row">
				<div class="form-group">
					<label for="shift-start">Shift Start:</label>
					<input type="datetime-local" id="shift-start" required />
				</div>
				<div class="form-group">
					<label for="shift-end">Shift End:</label>
					<input type="datetime-local" id="shift-end" required />
				</div>
			</div>
			<button id="calculate-btn">Calculate Salary</button>

			<div class="config-toggle">
				<button id="toggle-config">Edit Configuration Settings ▼</button>
				<div class="config-panel" id="config-panel">
					<!-- Configuration settings will be inserted here by JavaScript -->
				</div>
			</div>
		</div>

		<div class="results" id="results">
			<h2>Salary Breakdown</h2>
			<div class="results-content" id="results-content">
				<!-- Results will be inserted here by JavaScript -->
			</div>
		</div>
	`,
	);
}
