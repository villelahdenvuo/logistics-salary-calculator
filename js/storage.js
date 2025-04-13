/**
 * Storage utility module for handling localStorage/sessionStorage operations
 */

/**
 * Sets up persistence for a form input element
 * @param {HTMLInputElement} element - The input element to persist
 * @param {string} storageKey - The key to use in storage
 * @param {object} options - Configuration options
 * @param {Storage} [options.storageType=sessionStorage] - Storage type (sessionStorage or localStorage)
 * @param {Function} [options.onChange] - Callback function when value changes
 * @param {boolean} [options.loadOnInit=true] - Whether to load value from storage on initialization
 * @returns {object} - Object with utility methods
 */
export function persistInput(element, storageKey, options = {}) {
  const {
    storageType = sessionStorage,
    onChange = null,
    loadOnInit = true,
  } = options;

  // Save value to storage
  const saveValue = () => {
    const value = element.value;
    storageType.setItem(storageKey, value);
    return value;
  };

  // Load value from storage
  const loadValue = () => {
    const value = storageType.getItem(storageKey);
    if (value) {
      element.value = value;
    }
    return value;
  };

  // Clear value from storage
  const clearValue = () => {
    storageType.removeItem(storageKey);
    element.value = "";
  };

  // Set up change event listener
  element.addEventListener("change", (e) => {
    saveValue();
    if (onChange) {
      onChange(e, element.value);
    }
  });

  // Load value on initialization if enabled
  if (loadOnInit) {
    loadValue();
  }

  // Return utility methods
  return {
    save: saveValue,
    load: loadValue,
    clear: clearValue,
    getKey: () => storageKey,
    getStorageType: () => storageType,
  };
}

/**
 * Links multiple input elements with dependencies
 * @param {Array<object>} inputConfigs - Array of input configurations and their dependencies
 * @returns {object} - Object with utility methods for all inputs
 */
export function linkInputs(inputConfigs) {
  const handlers = {};

  inputConfigs.forEach((config) => {
    const { element, storageKey, options = {}, dependsOn = [] } = config;

    // Create handler for this input
    handlers[storageKey] = persistInput(element, storageKey, {
      ...options,
      onChange: (e, value) => {
        // Call the original onChange if provided
        if (options.onChange) {
          options.onChange(e, value);
        }

        // Update dependent elements
        dependsOn.forEach((dep) => {
          if (typeof dep.update === "function") {
            dep.update(e, value, element);
          }
        });
      },
    });
  });

  return {
    handlers,
    saveAll: () => {
      Object.values(handlers).forEach((handler) => handler.save());
    },
    loadAll: () => {
      Object.values(handlers).forEach((handler) => handler.load());
    },
    clearAll: () => {
      Object.values(handlers).forEach((handler) => handler.clear());
    },
  };
}
