/**
 * ICS Event Handler Module
 * Handles DOM events and UI interactions for ICS import functionality
 */

/**
 * ICS Event Handler class
 */
export class IcsEventHandler {
	constructor(container, stateManager) {
		this.container = container;
		this.stateManager = stateManager;

		this.init();
	}

	init() {
		this.attachEventListeners();
	}

	/**
	 * Attach all event listeners
	 */
	attachEventListeners() {
		this.attachFormListeners();
		this.attachShiftToggleListeners();
		this.attachWeekToggleListeners();
		this.setInitialWeekToggleStates();
	}

	/**
	 * Attach form-related event listeners
	 */
	attachFormListeners() {
		const urlInput = this.container.querySelector("#ics-url");
		const fetchButton = this.container.querySelector("#fetch-ics-btn");

		if (urlInput && fetchButton) {
			// Remove existing listeners by cloning the button
			const newFetchButton = fetchButton.cloneNode(true);
			fetchButton.parentNode.replaceChild(newFetchButton, fetchButton);

			// URL input change handler
			urlInput.addEventListener("input", (e) => {
				this.stateManager.setUrl(e.target.value);
			});

			// Fetch button click handler
			newFetchButton.addEventListener("click", () => {
				this.stateManager.fetchAndParseIcs();
			});
		}
	}

	/**
	 * Attach shift toggle event listeners
	 */
	attachShiftToggleListeners() {
		const shiftToggles = this.container.querySelectorAll(".shift-toggle");
		shiftToggles.forEach((toggle) => {
			toggle.addEventListener("change", (e) => {
				const shiftBlock = toggle.closest(".shift-block");
				const shiftId = shiftBlock ? shiftBlock.dataset.shiftId : null;

				if (shiftId) {
					const success = this.stateManager.updateShiftEnabled(shiftId, e.target.checked);
					if (success) {
						// Update DOM immediately without triggering re-render
						shiftBlock.className = `shift-block ${e.target.checked ? "enabled" : "disabled"}`;

						// Update week toggle state
						this.updateWeekToggleState(toggle);
					}
				}
			});
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
	 * Attach week toggle event listeners
	 */
	attachWeekToggleListeners() {
		const weekToggles = this.container.querySelectorAll(".week-toggle");
		weekToggles.forEach((toggle) => {
			toggle.addEventListener("change", (e) => {
				const weekRow = e.target.closest(".week-row");
				if (!weekRow) return;

				const isChecked = e.target.checked;
				const shiftToggles = weekRow.querySelectorAll(".shift-toggle");

				// Collect the shifts for this week
				const weekShifts = [];

				// Update all shift toggles in this week and collect shift data
				shiftToggles.forEach((shiftToggle) => {
					if (shiftToggle.checked !== isChecked) {
						shiftToggle.checked = isChecked;

						// Find the shift data
						const shiftBlock = shiftToggle.closest(".shift-block");
						const shiftId = shiftBlock ? shiftBlock.dataset.shiftId : null;

						if (shiftId) {
							const shifts = this.stateManager.getShifts();
							const shift = shifts.find((s) => s.id === shiftId);
							if (shift) {
								weekShifts.push(shift);
							}
							// Update DOM immediately
							shiftBlock.className = `shift-block ${isChecked ? "enabled" : "disabled"}`;
						}
					}
				});

				// Update state for all shifts in this week
				if (weekShifts.length > 0) {
					this.stateManager.updateWeekShifts(weekShifts, isChecked);
				}
			});
		});
	}

	/**
	 * Set initial week toggle states based on data attributes
	 */
	setInitialWeekToggleStates() {
		const weekRows = this.container.querySelectorAll(".week-row");
		weekRows.forEach((weekRow) => {
			const weekToggle = weekRow.querySelector(".week-toggle");
			const someEnabled = weekRow.dataset.someEnabled === "true";

			if (weekToggle && someEnabled) {
				weekToggle.indeterminate = true;
			}
		});
	}

	/**
	 * Re-attach event listeners after DOM update
	 */
	reattachListeners() {
		this.attachEventListeners();
	}
}
