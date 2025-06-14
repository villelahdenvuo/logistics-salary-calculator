import Component from "./Component.js";

/**
 * Tabs component that provides a simple tab interface
 * @param {Object} props - Component properties
 * @param {Array} props.tabs - Array of tab objects with {id, label, content}
 * @param {string} props.activeTab - ID of the currently active tab
 * @param {Function} props.onTabChange - Callback function when tab changes
 * @returns {string} HTML string for the tabs component
 */
export default function Tabs({ tabs = [], activeTab = null, _onTabChange = null } = {}) {
	const activeTabId = activeTab || (tabs.length > 0 ? tabs[0].id : null);

	const tabButtons = tabs
		.map(
			(tab) => `
			<button
				class="tab-button ${tab.id === activeTabId ? "active" : ""}"
				data-tab-id="${tab.id}"
				type="button"
			>
				${tab.label}
			</button>
		`,
		)
		.join("");

	const tabContents = tabs
		.map(
			(tab) => `
			<div
				class="tab-content ${tab.id === activeTabId ? "active" : ""}"
				data-tab-id="${tab.id}"
			>
				${tab.content}
			</div>
		`,
		)
		.join("");

	return Component(
		{},
		`
		<div class="tabs-container">
			<div class="tab-buttons">
				${tabButtons}
			</div>
			<div class="tab-contents">
				${tabContents}
			</div>
		</div>
	`,
	);
}

/**
 * Initialize tabs functionality for a given container
 * @param {string} containerSelector - CSS selector for the container
 * @param {Function} onTabChange - Callback function when tab changes
 */
export function initializeTabs(containerSelector, onTabChange = null) {
	const container = document.querySelector(containerSelector);
	if (!container) return;

	// Add event delegation for tab buttons
	container.addEventListener("click", (event) => {
		const tabButton = event.target.closest(".tab-button");
		if (!tabButton) return;

		const tabId = tabButton.dataset.tabId;

		// Remove active class from all buttons and contents
		container.querySelectorAll(".tab-button").forEach((btn) => btn.classList.remove("active"));
		container
			.querySelectorAll(".tab-content")
			.forEach((content) => content.classList.remove("active"));

		// Add active class to clicked button and corresponding content
		tabButton.classList.add("active");
		const targetContent = container.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
		if (targetContent) {
			targetContent.classList.add("active");
		}

		// Call the callback if provided
		if (onTabChange && typeof onTabChange === "function") {
			onTabChange(tabId);
		}
	});
}
