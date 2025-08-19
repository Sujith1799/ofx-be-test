import { validatePaymentInput, Currency } from '../src/lib/validation';
import { ErrorMessages } from '../src/lib/errors';

describe('validatePaymentInput', () => {
    it('returns valid for correct input', () => {
        const result = validatePaymentInput({ amount: 1000, currency: Currency.USD });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('returns invalid when input is null', () => {
        const result = validatePaymentInput(null);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.INVALID_INPUT_FORMAT);
    });

    it('returns invalid when input is undefined', () => {
        const result = validatePaymentInput(undefined);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.INVALID_INPUT_FORMAT);
    });

    it('returns invalid when input is not an object', () => {
        const result = validatePaymentInput('not an object');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.INVALID_INPUT_FORMAT);
    });

    it('returns invalid when input has parse error marker', () => {
        const result = validatePaymentInput({ __parseError: true });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.INVALID_INPUT_FORMAT);
    });

    it('validates amount is required', () => {
        const result = validatePaymentInput({ currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_REQUIRED);
    });

    it('validates amount is required when undefined', () => {
        const result = validatePaymentInput({ amount: undefined, currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_REQUIRED);
    });

    it('validates amount is required when null', () => {
        const result = validatePaymentInput({ amount: null, currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_REQUIRED);
    });

    it('validates amount is a number', () => {
        const result = validatePaymentInput({ amount: 'not a number', currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_NUMBER);
    });

    it('validates amount is a number - string number', () => {
        const result = validatePaymentInput({ amount: '1000', currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_NUMBER);
    });

    it('validates amount is positive', () => {
        const result = validatePaymentInput({ amount: -100, currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_POSITIVE);
    });

    it('validates amount is positive - zero', () => {
        const result = validatePaymentInput({ amount: 0, currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_POSITIVE);
    });

    it('validates amount is finite', () => {
        const result = validatePaymentInput({ amount: Infinity, currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_FINITE);
    });

    it('validates amount is finite - negative infinity', () => {
        const result = validatePaymentInput({ amount: -Infinity, currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_FINITE);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_POSITIVE);
    });

    it('validates amount is finite - NaN', () => {
        const result = validatePaymentInput({ amount: NaN, currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_FINITE);
    });

    it('validates currency is required', () => {
        const result = validatePaymentInput({ amount: 1000 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.CURRENCY_REQUIRED);
    });

    it('validates currency is required when empty string', () => {
        const result = validatePaymentInput({ amount: 1000, currency: '' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.CURRENCY_REQUIRED);
    });

    it('validates currency is a string', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 123 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.CURRENCY_MUST_BE_STRING);
    });

    it('validates currency format - invalid currency', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'INVALID' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.CURRENCY_INVALID);
    });

    it('validates currency format - lowercase', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'usd' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.CURRENCY_INVALID);
    });

    it('accepts valid USD currency', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'USD' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('accepts valid AUD currency', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'AUD' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('accepts valid EUR currency', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'EUR' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('accepts valid GBP currency', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'GBP' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('accepts valid SGD currency', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'SGD' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('accepts all supported currencies', () => {
        const currencies = Object.values(Currency);
        
        currencies.forEach(currency => {
            const result = validatePaymentInput({ amount: 1000, currency });
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
    });

    it('validates unexpected fields - single field', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'USD', extraField: 'value' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Unexpected fields: extraField');
    });

    it('validates unexpected fields - multiple fields', () => {
        const result = validatePaymentInput({ 
            amount: 1000, 
            currency: 'USD', 
            extraField1: 'value1',
            extraField2: 'value2'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Unexpected fields: extraField1, extraField2');
    });

    it('accepts decimal amounts', () => {
        const result = validatePaymentInput({ amount: 99.99, currency: 'USD' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('accepts very small amounts', () => {
        const result = validatePaymentInput({ amount: 0.01, currency: 'USD' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('accepts large amounts', () => {
        const result = validatePaymentInput({ amount: 999999.99, currency: 'USD' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('accumulates multiple validation errors', () => {
        const result = validatePaymentInput({ 
            amount: 'invalid',
            currency: 123,
            extraField: 'value'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_NUMBER);
        expect(result.errors).toContain(ErrorMessages.CURRENCY_MUST_BE_STRING);
        expect(result.errors).toContain('Unexpected fields: extraField');
    });

    it('handles edge case with all validation failures', () => {
        const result = validatePaymentInput({ 
            amount: -Infinity,
            currency: 'invalid',
            extra1: 'value1',
            extra2: 'value2'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_POSITIVE);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_MUST_BE_FINITE);
        expect(result.errors).toContain(ErrorMessages.CURRENCY_INVALID);
        expect(result.errors).toContain('Unexpected fields: extra1, extra2');
    });

    it('validates empty object', () => {
        const result = validatePaymentInput({});
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ErrorMessages.AMOUNT_REQUIRED);
        expect(result.errors).toContain(ErrorMessages.CURRENCY_REQUIRED);
    });
});