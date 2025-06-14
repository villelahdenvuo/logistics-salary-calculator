import Component from "./Component.js";

/**
 * Reusable Config Toggle component that handles its own DOM interactions
 * @param {Object} props - Component properties
 * @param {string} props.id - Unique identifier for the toggle (e.g., 'global')
 * @param {string} props.className - Additional CSS classes for customization
 * @returns {string} HTML string for the config toggle component
 */
export default function ConfigToggle(props = {}) {
	const { id = "default", className = "" } = props;

	// Schedule DOM initialization after the component is rendered
	setTimeout(() => {
		initializeConfigToggle(id);
	}, 0);

	return Component(
		props,
		`
		<div class="config-toggle ${className}">
			<button id="toggle-config-${id}">Edit Configuration Settings ▼</button>
			<div class="config-panel" id="config-panel-${id}">
				<!-- Configuration settings will be inserted here by JavaScript -->
			</div>
		</div>
	`,
	);
}

/**
 * Initialize config toggle functionality for a specific toggle
 * @param {string} id - The unique ID for this toggle
 */
function initializeConfigToggle(id) {
	const toggleConfigBtn = document.getElementById(`toggle-config-${id}`);
	const configPanel = document.getElementById(`config-panel-${id}`);

	if (!toggleConfigBtn || !configPanel) {
		return false; // Elements not available yet
	}

	// Check if already initialized (prevent duplicate event listeners)
	if (toggleConfigBtn.dataset.initialized === "true") {
		return true;
	}

	// Toggle configuration panel
	toggleConfigBtn.addEventListener("click", () => {
		configPanel.classList.toggle("active");
		if (configPanel.classList.contains("active")) {
			toggleConfigBtn.textContent = "Hide Configuration Settings ▲";
			toggleConfigBtn.classList.add("active");

			// Use the global populateConfigPanel function
			if (window.populateConfigPanel) {
				window.populateConfigPanel(configPanel);
			}
		} else {
			toggleConfigBtn.textContent = "Edit Configuration Settings ▼";
			toggleConfigBtn.classList.remove("active");
		}
	});

	// Mark as initialized
	toggleConfigBtn.dataset.initialized = "true";
	return true;
}
