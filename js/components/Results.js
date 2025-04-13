import HourlyBreakdownContainer from "./HourlyBreakdownContainer.js";
import ResultsSummary from "./ResultsSummary.js";

/**
 * Renders the complete results section
 *
 * @param {object} props - Component properties
 * @param {object} props.results - Calculation results
 * @param {object} props.config - Calculator configuration
 * @param {boolean} props.includeBreak - Whether lunch break was included
 * @param {number} props.age - Employee age
 * @param {Function} props.formatTime - Function to format time
 * @param {Function} props.formatCurrency - Function to format currency
 * @param {Function} props.formatNumber - Function to format number
 * @returns {string} - Component HTML
 */
export default function Results(props = {}) {
	const { results, config, includeBreak, age, formatTime, formatCurrency, formatNumber } = props;

	const hourlyBreakdown = HourlyBreakdownContainer({
		hourlyBreakdown: results.hourlyBreakdown,
		formatTime,
		formatCurrency,
	});

	const resultsSummary = ResultsSummary({
		results,
		config,
		includeBreak,
		age,
		formatCurrency,
		formatNumber,
	});

	return `
    ${hourlyBreakdown}
    ${resultsSummary}
  `;
}
