import { ErrorMessages } from './errors';

export enum Currency {
    USD = 'USD',
    AUD = 'AUD',
    EUR = 'EUR',
    GBP = 'GBP',
    SGD = 'SGD'
}

export interface PaymentInput {
    amount: number;
    currency: Currency;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export const validatePaymentInput = (input: any): ValidationResult => {
    const errors: string[] = [];

    // Check if input is valid object
    if (!input || typeof input !== 'object') {
        return {
            isValid: false,
            errors: [ErrorMessages.INVALID_INPUT_FORMAT]
        };
    }

    // Validate amount
    if (input.amount === undefined || input.amount === null) {
        errors.push(ErrorMessages.AMOUNT_REQUIRED);
    } else if (typeof input.amount !== 'number') {
        errors.push(ErrorMessages.AMOUNT_MUST_BE_NUMBER);
    } else {
        // Check finite first, then positive (to catch both for -Infinity)
        if (!isFinite(input.amount)) {
            errors.push(ErrorMessages.AMOUNT_MUST_BE_FINITE);
        }
        if (input.amount <= 0) {
            errors.push(ErrorMessages.AMOUNT_MUST_BE_POSITIVE);
        }
    }

    // Validate currency
    if (!input.currency) {
        errors.push(ErrorMessages.CURRENCY_REQUIRED);
    } else if (typeof input.currency !== 'string') {
        errors.push(ErrorMessages.CURRENCY_MUST_BE_STRING);
    } else if (!Object.values(Currency).includes(input.currency as Currency)) {
        errors.push(ErrorMessages.CURRENCY_INVALID);
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