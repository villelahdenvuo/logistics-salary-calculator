/**
 * Renders a single hour breakdown box with start/end time and salary details
 *
 * @param {object} props - Component properties
 * @param {Date} props.startTime - Hour start time
 * @param {Date} props.endTime - Hour end time
 * @param {number} props.baseSalary - Base salary amount for this hour
 * @param {Array} props.extras - Extra payments applicable for this hour
 * @param {number} props.totalForHour - Total amount for this hour
 * @param {Function} props.formatTime - Function to format time
 * @param {Function} props.formatCurrency - Function to format currency
 * @returns {string} - Component HTML
 */
export default function HourBreakdown(props = {}) {
	const {
		startTime,
		endTime,
		baseSalary,
		extras = [],
		totalForHour,
		formatTime,
		formatCurrency,
	} = props;

	// Format times
	const startTimeStr = formatTime(startTime);
	const endTimeStr = formatTime(endTime);

	// Collect unique emojis for this hour
	const emojis = new Set();
	extras.forEach((extra) => emojis.add(extra.emoji));
	const emojiString = Array.from(emojis).join(" ");

	// Build the inline extras text
	const extrasInline = extras
		.map((extra) => `${extra.emoji} +${formatCurrency(extra.amount)}`)
		.join(" · ");

	return `
    <div class="hour-breakdown">
      <div class="hour-header">
        <span>${emojiString ? `${emojiString} ` : ""}${startTimeStr} - ${endTimeStr}</span>
        <span>${formatCurrency(totalForHour)}</span>
      </div>
      <div class="hour-details">
        <div>
          💵 ${formatCurrency(baseSalary)}${extrasInline ? " · " + extrasInline : ""}
        </div>
      </div>
    </div>
  `;
}
