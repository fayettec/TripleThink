/**
 * Form Validation Utilities
 */

const validators = {
  // Validate ID format
  entityId(value, type) {
    const prefixes = {
      event: 'evt-',
      character: 'char-',
      object: 'obj-',
      location: 'loc-',
      fiction: 'fiction-',
      system: 'sys-',
    };

    const prefix = prefixes[type];
    if (!prefix) return { valid: false, message: 'Invalid entity type' };

    if (!value.startsWith(prefix)) {
      return {
        valid: false,
        message: `ID must start with '${prefix}'`,
      };
    }

    if (!/^[a-z0-9-]+$/.test(value)) {
      return {
        valid: false,
        message: 'ID can only contain lowercase letters, numbers, and hyphens',
      };
    }

    return { valid: true };
  },

  // Validate ISO 8601 timestamp
  timestamp(value) {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z?$/;

    if (!iso8601Regex.test(value)) {
      return {
        valid: false,
        message: 'Must be ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)',
      };
    }

    return { valid: true };
  },

  // Validate required field
  required(value, fieldName) {
    if (!value || value.trim() === '') {
      return {
        valid: false,
        message: `${fieldName} is required`,
      };
    }

    return { valid: true };
  },

  // Validate reference exists
  async entityExists(entityId) {
    try {
      await api.getEntity(entityId);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: `Entity '${entityId}' not found`,
      };
    }
  },
};
