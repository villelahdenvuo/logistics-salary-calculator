import BreakdownItem from "./BreakdownItem.js";

/**
 * Renders the configuration panel with all settings
 *
 * @param {object} props - Component properties
 * @param {object} props.config - Calculator configuration
 * @param {object} props.tyelRates - TyEL pension rates
 * @param {number} props.tvmRate - Unemployment insurance rate
 * @param {Function} props.formatCurrency - Function to format currency
 * @returns {string} - Component HTML
 */
export default function ConfigPanel(props = {}) {
	const { config, tyelRates, tvmRate, formatCurrency } = props;

	return `
    <div class="config-section">
      <h4>Basic Configuration</h4>
      ${BreakdownItem({
				label: "Base Hourly Rate:",
				value: formatCurrency(config.baseSalary),
			})}
      ${BreakdownItem({
				label: "Lunch Break Duration:",
				value: `${config.breakDuration} minutes`,
			})}
    </div>

    <div class="config-section">
      <h4>Deduction Rates (2025)</h4>
      ${BreakdownItem({
				label: "TyEL Rate (under 53):",
				value: `${tyelRates.under53}%`,
			})}
      ${BreakdownItem({
				label: "TyEL Rate (53-62):",
				value: `${tyelRates.between53and62}%`,
			})}
      ${BreakdownItem({
				label: "TyEL Rate (63+):",
				value: `${tyelRates.over63}%`,
			})}
      ${BreakdownItem({
				label: "Unemployment Insurance Rate:",
				value: `${tvmRate}%`,
			})}
    </div>

    <div class="config-section">
      <h4>Bonus Rates</h4>
      ${Object.entries(config.extras)
				.map(([extraKey, extra]) => {
					const rate = extraKey === "sundayBase" ? "100% of base" : formatCurrency(extra.rate);
					return BreakdownItem({
						label: `${extra.name}:`,
						value: rate,
						emoji: extra.emoji || "",
					});
				})
				.join("")}
    </div>
  `;
}
