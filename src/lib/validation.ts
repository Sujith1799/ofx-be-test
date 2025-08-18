export enum Currency {
    USD = 'USD',
    AUD = 'AUD'
}

export interface PaymentInput {
    amount: number;
    currency: Currency;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

const isValidCurrency = (value: string): value is Currency => {
    return Object.values(Currency).includes(value as Currency);
};

export const validatePaymentInput = (input: any): ValidationResult => {
    const errors: string[] = [];

    if (!input || typeof input !== 'object') {
        return { isValid: false, errors: ['Invalid input format'] };
    }

    // Check for unexpected fields first
    const allowedFields = ['amount', 'currency'];
    const providedFields = Object.keys(input);
    const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (unexpectedFields.length > 0) {
        errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
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
    if (input.currency === undefined || input.currency === null) {
        errors.push('Currency is required');
    } else if (typeof input.currency !== 'string') {
        errors.push('Currency must be a string');
    } else if (!isValidCurrency(input.currency)) {
        errors.push('Currency must be a 3-letter uppercase code');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};