/**
 * ICS Import Handler Module
 * Orchestrates state management and DOM interactions for ICS import functionality
 */

import { IcsStateManager } from "./ics-state-manager.js";
import { IcsEventHandler } from "./ics-event-handler.js";
import IcsImportSection from "./components/IcsImportSection.js";

/**
 * ICS Import Handler class
 * Coordinates between state management and event handling
 */
export class IcsImportHandler {
	constructor(container, storageHandler = null) {
		this.container = container;
		this.stateManager = new IcsStateManager(storageHandler);
		this.eventHandler = null;

		this.init();
	}

	init() {
		// Subscribe to state changes to trigger re-renders
		this.stateManager.subscribe((state) => {
			this.render(state);
		});

		// Initial render
		this.render(this.stateManager.getState());
	}

	/**
	 * Render the component with current state
	 * @param {Object} state - Current state from state manager
	 */
	render(state) {
		this.container.innerHTML = IcsImportSection(state);

		// Recreate event handler after DOM update
		if (this.eventHandler) {
			this.eventHandler.container = this.container;
			this.eventHandler.reattachListeners();
		} else {
			this.eventHandler = new IcsEventHandler(this.container, this.stateManager);
		}
	}

	// Utility methods for external access
	getUrl() {
		return this.stateManager.getUrl();
	}

	setUrl(url) {
		this.stateManager.setUrl(url);
	}

	clearUrl() {
		this.stateManager.clearUrl();
	}

	getShifts() {
		return this.stateManager.getShifts();
	}

	getEnabledShifts() {
		return this.stateManager.getEnabledShifts();
	}
}

/**
 * Initialize ICS import functionality
 * @param {HTMLElement} container - Container element for the ICS import section
 * @param {object} storageHandler - Storage handler object (optional)
 * @returns {IcsImportHandler} Handler instance
 */
export function initializeIcsImport(container, storageHandler = null) {
	return new IcsImportHandler(container, storageHandler);
}
