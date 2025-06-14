/**
 * Editable Configuration Panel component
 * Renders configuration values as editable inputs with save/reset functionality
 */

/**
 * Renders an editable configuration input field
 * @param {object} props - Component properties
 * @param {string} props.label - Label for the input
 * @param {string} props.path - Dot notation path for config value
 * @param {any} props.value - Current value
 * @param {string} props.type - Input type (number, text)
 * @param {string} props.suffix - Suffix to display (%, €, etc.)
 * @param {number} props.min - Minimum value for number inputs
 * @param {number} props.max - Maximum value for number inputs
 * @param {number} props.step - Step value for number inputs
 * @returns {string} - Component HTML
 */
function EditableConfigItem(props = {}) {
	const { label, path, value, type = "number", suffix = "", min, max, step = "0.01" } = props;

	const inputId = `config-${path.replace(/\./g, "-")}`;

	const inputAttributes = [
		`type="${type}"`,
		`id="${inputId}"`,
		`data-config-path="${path}"`,
		`value="${value}"`,
		'class="config-input"',
	];

	if (min !== undefined) inputAttributes.push(`min="${min}"`);
	if (max !== undefined) inputAttributes.push(`max="${max}"`);
	if (type === "number") inputAttributes.push(`step="${step}"`);

	return `
		<div class="config-item editable">
			<label for="${inputId}">${label}</label>
			<div class="config-input-container">
				<input ${inputAttributes.join(" ")} />
				${suffix ? `<span class="config-suffix">${suffix}</span>` : ""}
			</div>
		</div>
	`;
}

/**
 * Renders the editable configuration panel
 * @param {object} props - Component properties
 * @param {object} props.config - Current configuration
 * @returns {string} - Component HTML
 */
export default function EditableConfigPanel(props = {}) {
	const { config } = props;

	return `
		<div class="config-panel-header">
			<div class="config-actions">
				<button id="save-config" class="config-btn save">💾 Save Changes</button>
				<button id="reset-config" class="config-btn reset">🔄 Reset to Defaults</button>
			</div>
		</div>

		<div class="config-section">
			<h4>Basic Configuration</h4>
			${EditableConfigItem({
				label: "Base Hourly Rate:",
				path: "salaryConfig.baseSalary",
				value: config.salaryConfig.baseSalary,
				suffix: "€",
				min: 0,
			})}
			${EditableConfigItem({
				label: "Lunch Break Duration:",
				path: "salaryConfig.breakDuration",
				value: config.salaryConfig.breakDuration,
				suffix: "min",
				min: 0,
				max: 120,
				step: "1",
			})}
		</div>

		<div class="config-section">
			<h4>Deduction Rates (2025)</h4>
			${EditableConfigItem({
				label: "Age (for TyEL calculation):",
				path: "age",
				value: config.age,
				suffix: "years",
				min: 18,
				max: 100,
				step: "1",
			})}
			${EditableConfigItem({
				label: "TyEL Rate (under 53):",
				path: "tyelRates.under53",
				value: config.tyelRates.under53,
				suffix: "%",
				min: 0,
				max: 100,
			})}
			${EditableConfigItem({
				label: "TyEL Rate (53-62):",
				path: "tyelRates.between53and62",
				value: config.tyelRates.between53and62,
				suffix: "%",
				min: 0,
				max: 100,
			})}
			${EditableConfigItem({
				label: "TyEL Rate (63+):",
				path: "tyelRates.over63",
				value: config.tyelRates.over63,
				suffix: "%",
				min: 0,
				max: 100,
			})}
			${EditableConfigItem({
				label: "Unemployment Insurance Rate:",
				path: "tvmRate",
				value: config.tvmRate,
				suffix: "%",
				min: 0,
				max: 100,
			})}
		</div>

		<div class="config-section">
			<h4>Bonus Rates</h4>
			${Object.entries(config.salaryConfig.extras)
				.filter(([key]) => key !== "sundayBase") // Sunday base is calculated automatically
				.map(([key, extra]) =>
					EditableConfigItem({
						label: `${extra.name}:`,
						path: `salaryConfig.extras.${key}.rate`,
						value: extra.rate,
						suffix: "€",
						min: 0,
					}),
				)
				.join("")}
			<div class="config-item readonly">
				<label>Sunday Bonus (100% of base salary):</label>
				<div class="config-value">
					🏖️ Calculated automatically
				</div>
			</div>
		</div>

		<div class="config-status" id="config-status"></div>
	`;
}
