class BatchValidator {
  /**
   * Validate batch creation input
   */
  validateBatchCreation(data) {
    const errors = [];

    // Validate template ID
    if (!data.templateId) {
      errors.push('Template ID is required');
    }

    // Validate recipients
    if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
      errors.push('At least one recipient is required');
    } else {
      // Validate each recipient
      data.recipients.forEach((recipient, index) => {
        if (!recipient.phoneNumber) {
          errors.push(`Recipient at index ${index} is missing phone number`);
        } else if (!this.isValidPhoneNumber(recipient.phoneNumber)) {
          errors.push(`Invalid phone number for recipient at index ${index}`);
        }

        // Validate variables
        if (!recipient.variables || typeof recipient.variables !== 'object') {
          errors.push(`Recipient at index ${index} is missing variables`);
        }
      });
    }

    // Validate options
    if (data.options) {
      // Validate schedule time
      if (data.options.scheduleTime) {
        const scheduleTime = new Date(data.options.scheduleTime);
        if (isNaN(scheduleTime.getTime())) {
          errors.push('Invalid schedule time format');
        } else if (scheduleTime < new Date()) {
          errors.push('Schedule time must be in the future');
        }
      }

      // Validate retry strategy
      if (data.options.retryStrategy) {
        const { maxAttempts, backoffMinutes } = data.options.retryStrategy;
        if (maxAttempts && (typeof maxAttempts !== 'number' || maxAttempts < 1)) {
          errors.push('Max attempts must be a positive number');
        }
        if (backoffMinutes && (typeof backoffMinutes !== 'number' || backoffMinutes < 1)) {
          errors.push('Backoff minutes must be a positive number');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phone) {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Must be either 10 digits or 11 digits starting with 1
    if (digits.length === 10) {
      return true;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return true;
    }

    return false;
  }

  /**
   * Validate batch ID format
   */
  isValidBatchId(batchId) {
    // Batch ID should be a non-empty string
    if (!batchId || typeof batchId !== 'string') {
      return false;
    }

    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(batchId);
  }

  /**
   * Validate preview parameters
   */
  validatePreviewParams(params) {
    const errors = [];

    if (!this.isValidBatchId(params.batchId)) {
      errors.push('Invalid batch ID');
    }

    if (params.previewCount) {
      const count = parseInt(params.previewCount);
      if (isNaN(count) || count < 1 || count > 50) {
        errors.push('Preview count must be between 1 and 50');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate status update
   */
  validateStatusUpdate(params) {
    const errors = [];
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];

    if (!this.isValidBatchId(params.batchId)) {
      errors.push('Invalid batch ID');
    }

    if (!validStatuses.includes(params.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate message status update
   */
  validateMessageStatusUpdate(params) {
    const errors = [];
    const validStatuses = ['pending', 'sent', 'delivered', 'failed'];

    if (!params.messageId) {
      errors.push('Message ID is required');
    }

    if (!validStatuses.includes(params.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const batchValidator = new BatchValidator();
