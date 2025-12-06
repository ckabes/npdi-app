const TicketTemplate = require('../models/TicketTemplate');
const User = require('../models/User');

/**
 * Validates that all required fields (per template's submissionRequirements) are filled
 * @param {Object} ticketData - The ticket data to validate
 * @param {string} userIdentifier - The user's email or employeeId to look up their template
 * @param {boolean} isEmployeeId - Whether userIdentifier is an employeeId (default: false)
 * @returns {Object} { isValid: boolean, missingFields: array, template: object }
 */
const validateSubmissionRequirements = async (ticketData, userIdentifier, isEmployeeId = false) => {
  try {
    let template = null;

    // If ticket has a stored template (existing ticket), use that
    // This ensures validation is consistent with the template used when ticket was created
    if (ticketData.template) {
      template = await TicketTemplate.findById(ticketData.template).populate('formConfiguration');

      // If the stored template is inactive or deleted, fall through to user's current template
      if (template && !template.isActive) {
        console.warn(`Ticket's stored template ${ticketData.template} is inactive, using user's current template`);
        template = null;
      }
    }

    // If no stored template (new ticket) or stored template not found, use user's current template
    if (!template) {
      // Support both email and employeeId
      const userQuery = isEmployeeId
        ? { employeeId: userIdentifier }
        : { $or: [{ employeeId: userIdentifier }, { email: userIdentifier }] };

      const user = await User.findOne(userQuery).populate({
        path: 'ticketTemplate',
        populate: { path: 'formConfiguration' }
      });

      // Check if user has an assigned template
      if (user?.ticketTemplate && user.ticketTemplate.isActive) {
        template = user.ticketTemplate;
      }
    }

    // Fallback to default template if still no template found
    if (!template) {
      template = await TicketTemplate.findOne({
        isDefault: true,
        isActive: true
      }).populate('formConfiguration');
    }

    // If still no template found, allow submission (no requirements to check)
    if (!template) {
      console.warn('No template found for user:', userIdentifier);
      return { isValid: true, missingFields: [], template: null };
    }

    // Get submission requirements from template
    const requiredFieldKeys = template.submissionRequirements || [];

    // If no requirements defined, allow submission
    if (requiredFieldKeys.length === 0) {
      return { isValid: true, missingFields: [], template };
    }

    // Check which required fields are missing or empty
    const missingFields = [];

    for (const fieldKey of requiredFieldKeys) {
      // Try to find the value using different possible paths
      let value = getNestedValue(ticketData, fieldKey);

      // If not found and fieldKey doesn't contain a dot, try common nested paths
      if (isFieldEmpty(value) && !fieldKey.includes('.')) {
        // Try common paths for pricing-related fields
        const commonPaths = [
          `pricingData.standardCosts.${fieldKey}`,
          `pricingData.${fieldKey}`,
          `chemicalProperties.${fieldKey}`,
          `corpbaseData.${fieldKey}`
        ];

        for (const path of commonPaths) {
          value = getNestedValue(ticketData, path);
          if (!isFieldEmpty(value)) {
            break; // Found it!
          }
        }
      }

      if (isFieldEmpty(value)) {
        // Get field label from form configuration for user-friendly error messages
        const fieldLabel = getFieldLabel(template.formConfiguration, fieldKey);
        missingFields.push({
          fieldKey,
          fieldLabel: fieldLabel || fieldKey
        });
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      template,
      requiredFieldKeys
    };
  } catch (error) {
    console.error('Error validating submission requirements:', error);
    // On error, fail open (allow submission) to prevent blocking users
    return { isValid: true, missingFields: [], template: null, error: error.message };
  }
};

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - The object to search
 * @param {string} path - Dot-notated path (e.g., 'chemicalProperties.casNumber')
 * @returns {*} The value at the path, or undefined
 */
const getNestedValue = (obj, path) => {
  if (!obj || typeof obj !== 'object') return undefined;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }

  return current;
};

/**
 * Check if a field value is considered empty
 * @param {*} value - The value to check
 * @returns {boolean} True if empty, false otherwise
 */
const isFieldEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Get field label from form configuration
 * @param {Object} formConfig - The form configuration object
 * @param {string} fieldKey - The field key to look up
 * @returns {string|null} The field label or null
 */
const getFieldLabel = (formConfig, fieldKey) => {
  if (!formConfig?.sections) return null;

  for (const section of formConfig.sections) {
    const field = section.fields?.find(f => f.fieldKey === fieldKey);
    if (field) return field.label;
  }

  return null;
};

module.exports = {
  validateSubmissionRequirements,
  getNestedValue,
  isFieldEmpty,
  getFieldLabel
};
