/**
 * Event Delegation Utility
 * Provides a robust event handling system that survives DOM re-renders
 *
 * PROBLEM SOLVED: Previously, when components were re-rendered using innerHTML,
 * all event listeners were lost because the DOM elements were completely replaced.
 * This required manual re-attachment of listeners after each render.
 *
 * SOLUTION: Event delegation attaches listeners to a parent container that doesn't
 * get re-rendered. Events bubble up from child elements to the parent, where they
 * are handled based on CSS selectors. This way, even if child elements are replaced,
 * the listeners remain active on the parent.
 */
export class EventDelegator {
	constructor(container) {
		this.container = container;
		this.handlers = new Map();
		this.init();
	}

	init() {
		// Set up delegation for common events
		const events = ["click", "change", "input", "submit", "keyup", "keydown", "focus", "blur"];

		events.forEach((eventType) => {
			this.container.addEventListener(eventType, (e) => {
				this.handleDelegatedEvent(e, eventType);
			});
		});
	}

	/**
	 * Register an event handler for elements matching a selector
	 * @param {string} eventType - The event type (click, change, etc.)
	 * @param {string} selector - CSS selector to match target elements
	 * @param {function} handler - Event handler function
	 */
	on(eventType, selector, handler) {
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, new Map());
		}

		this.handlers.get(eventType).set(selector, handler);
	}

	/**
	 * Handle delegated events by checking if target matches any registered selectors
	 */
	handleDelegatedEvent(event, eventType) {
		const eventHandlers = this.handlers.get(eventType);
		if (!eventHandlers) return;

		eventHandlers.forEach((handler, selector) => {
			const target = event.target.closest(selector);
			if (target && this.container.contains(target)) {
				// Create a new event object with the matched element as target
				const delegatedEvent = Object.create(event);
				delegatedEvent.delegatedTarget = target;
				// Override the target to be the matched element
				Object.defineProperty(delegatedEvent, "target", {
					value: target,
					writable: false,
				});
				// Call the handler with the original context (not setting 'this' to target)
				handler(delegatedEvent);
			}
		});
	}

	/**
	 * Remove event handler for a specific selector
	 */
	off(eventType, selector) {
		const eventHandlers = this.handlers.get(eventType);
		if (eventHandlers) {
			eventHandlers.delete(selector);
		}
	}

	/**
	 * Clear all event handlers
	 */
	clear() {
		this.handlers.clear();
	}

	/**
	 * Convenience method for click events
	 */
	onClick(selector, handler) {
		this.on("click", selector, handler);
	}

	/**
	 * Convenience method for change events
	 */
	onChange(selector, handler) {
		this.on("change", selector, handler);
	}

	/**
	 * Convenience method for input events
	 */
	onInput(selector, handler) {
		this.on("input", selector, handler);
	}

	/**
	 * Get event handlers for debugging/testing
	 */
	getHandlers() {
		return this.handlers;
	}
}
