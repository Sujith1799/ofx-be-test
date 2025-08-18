export interface PaymentInput {
    amount: number;
    currency: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export const validatePaymentInput = (input: any): ValidationResult => {
    const errors: string[] = [];

    if (!input || typeof input !== 'object') {
        return { isValid: false, errors: ['Invalid input format'] };
    }

    // Validate amount
    if (input.amount === undefined || input.amount === null) {
        errors.push('Amount is required');
    } else if (typeof input.amount !== 'number') {
        errors.push('Amount must be a number');
    } else if (input.amount <= 0) {
        errors.push('Amount must be greater than 0');
    } else if (!isFinite(input.amount)) {
        errors.push('Amount must be a finite number');
    }

    // Validate currency
    if (!input.currency) {
        errors.push('Currency is required');
    } else if (typeof input.currency !== 'string') {
        errors.push('Currency must be a string');
    } else if (!/^[A-Z]{3}$/.test(input.currency)) {
        errors.push('Currency must be a 3-letter uppercase code (e.g., USD, EUR, GBP)');
    }

    // Check for unexpected fields
    const allowedFields = ['amount', 'currency'];
    const providedFields = Object.keys(input);
    const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (unexpectedFields.length > 0) {
        errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};