import { validatePaymentInput, Currency } from '../src/lib/validation';

describe('validatePaymentInput', () => {
    it('returns valid for correct input', () => {
        const result = validatePaymentInput({ amount: 1000, currency: Currency.USD });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('returns invalid when input is null', () => {
        const result = validatePaymentInput(null);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid input format');
    });

    it('validates amount is required', () => {
        const result = validatePaymentInput({ currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Amount is required');
    });

    it('validates amount is a number', () => {
        const result = validatePaymentInput({ amount: 'not a number', currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Amount must be a number');
    });

    it('validates amount is positive', () => {
        const result = validatePaymentInput({ amount: -100, currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Amount must be greater than 0');
    });

    it('validates amount is finite', () => {
        const result = validatePaymentInput({ amount: Infinity, currency: Currency.USD });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Amount must be a finite number');
    });

    it('validates currency is required', () => {
        const result = validatePaymentInput({ amount: 1000 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Currency is required');
    });

    it('validates currency format - invalid currency', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'EUR' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Currency must be a 3-letter uppercase code');
    });

    it('validates currency format - lowercase', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'usd' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Currency must be a 3-letter uppercase code');
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

    it('validates unexpected fields', () => {
        const result = validatePaymentInput({ amount: 1000, currency: 'USD', extraField: 'value' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Unexpected fields: extraField');
    });
});