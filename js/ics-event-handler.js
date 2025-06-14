/**
 * ICS Event Handler Module
 * Handles DOM events and UI interactions for ICS import functionality
 */

import { EventDelegator } from "./components/EventDelegator.js";

/**
 * ICS Event Handler class
 */
export class IcsEventHandler {
	constructor(container, stateManager, icsHandler = null) {
		this.container = container;
		this.stateManager = stateManager;
		this.icsHandler = icsHandler; // Reference to parent handler for updates
		this.delegator = new EventDelegator(container);
		this.isUpdating = false; // Prevent multiple simultaneous updates

		this.init();
	}

	init() {
		this.setupEventDelegation();
		this.setInitialWeekToggleStates();
	}

	/**
	 * Set up event delegation for all UI interactions
	 * This replaces the need for manual event listener attachment
	 */
	setupEventDelegation() {
		// ICS URL input changes
		this.delegator.onInput("#ics-url", (e) => {
			this.stateManager.setUrl(e.target.value);
		});

		// Fetch ICS button
		this.delegator.onClick("#fetch-ics-btn", () => {
			this.stateManager.fetchAndParseIcs();
		});

		// Individual shift toggles
		this.delegator.onChange(".shift-toggle", (e) => {
			if (this.isUpdating) {
				return;
			}

			const shiftBlock = e.target.closest(".shift-block");
			const shiftId = shiftBlock ? shiftBlock.dataset.shiftId : null;

			if (shiftId) {
				this.isUpdating = true;
				// Only update the state - the re-render will handle the visual updates
				this.stateManager.updateShiftEnabled(shiftId, e.target.checked);

				// Reset flag after a short delay to allow re-render to complete
				setTimeout(() => {
					this.isUpdating = false;
				}, 100);
			}
		});

		// Allow clicking on shift block to toggle checkbox
		this.delegator.onClick(".shift-block", (e) => {
			// Don't toggle if the click was on the checkbox itself
			if (e.target.classList.contains("shift-toggle")) {
				return;
			}

			if (this.isUpdating) {
				return;
			}

			const shiftBlock = e.target.closest(".shift-block");
			const checkbox = shiftBlock ? shiftBlock.querySelector(".shift-toggle") : null;

			if (checkbox) {
				// Toggle the checkbox - this will trigger the change event above
				checkbox.checked = !checkbox.checked;
				checkbox.dispatchEvent(new Event("change", { bubbles: true }));
			}
		});

		// Week toggles (select/deselect all shifts in a week)
		this.delegator.onChange(".week-toggle", (e) => {
			const weekRow = e.target.closest(".week-row");
			if (!weekRow) return;

			const isChecked = e.target.checked;
			const shiftToggles = weekRow.querySelectorAll(".shift-toggle");

			// Collect shift IDs and prepare batch update
			const updates = [];
			shiftToggles.forEach((shiftToggle) => {
				const shiftBlock = shiftToggle.closest(".shift-block");
				const shiftId = shiftBlock ? shiftBlock.dataset.shiftId : null;
				if (shiftId) {
					updates.push({ shiftId, isEnabled: isChecked });
				}
			});

			// Update all shifts in this week in a single batch
			if (updates.length > 0) {
				this.stateManager.updateMultipleShifts(updates);
			}
		});
	}

	/**
	 * Update week toggle state based on its shift toggles
	 * @param {HTMLElement} shiftToggle - The shift toggle that was changed
	 */
	updateWeekToggleState(shiftToggle) {
		const weekRow = shiftToggle.closest(".week-row");
		if (!weekRow) return;

		const weekToggle = weekRow.querySelector(".week-toggle");
		const allShiftToggles = weekRow.querySelectorAll(".shift-toggle");

		if (!weekToggle || allShiftToggles.length === 0) return;

		const checkedShifts = Array.from(allShiftToggles).filter((toggle) => toggle.checked);
		const allChecked = checkedShifts.length === allShiftToggles.length;
		const someChecked = checkedShifts.length > 0;

		weekToggle.checked = allChecked;
		weekToggle.indeterminate = someChecked && !allChecked;
	}

	/**
	 * Set initial week toggle states based on data attributes
	 */
	setInitialWeekToggleStates() {
		const weekRows = this.container.querySelectorAll(".week-row");
		weekRows.forEach((weekRow) => {
			const weekToggle = weekRow.querySelector(".week-toggle");
			const allEnabled = weekRow.dataset.allEnabled === "true";
			const someEnabled = weekRow.dataset.someEnabled === "true";

			if (weekToggle) {
				weekToggle.checked = allEnabled;
				weekToggle.indeterminate = someEnabled && !allEnabled;
			}
		});
	}
}
