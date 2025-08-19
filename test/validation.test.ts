import { validatePaymentInput, Currency } from '../src/lib/validation';
import { ErrorMessages } from '../src/lib/errors';

describe('validatePaymentInput', () => {
    it('returns valid for correct input', () => {
        const result = validatePaymentInput({ amount: 1000, currency: Currency.USD });
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

    test.each([
        [null, [ErrorMessages.INVALID_INPUT_FORMAT]],
        [undefined, [ErrorMessages.INVALID_INPUT_FORMAT]],
        ['not an object', [ErrorMessages.INVALID_INPUT_FORMAT]],
        [{ currency: Currency.USD }, [ErrorMessages.AMOUNT_REQUIRED]],
        [{ amount: undefined, currency: Currency.USD }, [ErrorMessages.AMOUNT_REQUIRED]],
        [{ amount: null, currency: Currency.USD }, [ErrorMessages.AMOUNT_REQUIRED]],
        [{ amount: 'not a number', currency: Currency.USD }, [ErrorMessages.AMOUNT_MUST_BE_NUMBER]],
        [{ amount: '1000', currency: Currency.USD }, [ErrorMessages.AMOUNT_MUST_BE_NUMBER]],
        [{ amount: -100, currency: Currency.USD }, [ErrorMessages.AMOUNT_MUST_BE_POSITIVE]],
        [{ amount: 0, currency: Currency.USD }, [ErrorMessages.AMOUNT_MUST_BE_POSITIVE]],
        [{ amount: Infinity, currency: Currency.USD }, [ErrorMessages.AMOUNT_MUST_BE_FINITE]],
        [{ amount: -Infinity, currency: Currency.USD }, [ErrorMessages.AMOUNT_MUST_BE_FINITE, ErrorMessages.AMOUNT_MUST_BE_POSITIVE]],
        [{ amount: NaN, currency: Currency.USD }, [ErrorMessages.AMOUNT_MUST_BE_FINITE]],
        [{ amount: 1000 }, [ErrorMessages.CURRENCY_REQUIRED]],
        [{ amount: 1000, currency: '' }, [ErrorMessages.CURRENCY_REQUIRED]],
        [{ amount: 1000, currency: 123 }, [ErrorMessages.CURRENCY_MUST_BE_STRING]],
        [{ amount: 1000, currency: 'INVALID' }, [ErrorMessages.CURRENCY_INVALID]],
        [{ amount: 1000, currency: 'usd' }, [ErrorMessages.CURRENCY_INVALID]],
        [{ amount: 1000, currency: 'USD', extraField: 'value' }, ['Unexpected fields: extraField']],
        [
            { amount: 1000, currency: 'USD', extraField1: 'value1', extraField2: 'value2' },
            ['Unexpected fields: extraField1, extraField2']
        ],
        [
            { amount: 'invalid', currency: 123, extraField: 'value' },
            [
                ErrorMessages.AMOUNT_MUST_BE_NUMBER,
                ErrorMessages.CURRENCY_MUST_BE_STRING,
                'Unexpected fields: extraField'
            ]
        ],
        [
            { amount: -Infinity, currency: 'invalid', extra1: 'value1', extra2: 'value2' },
            [
                ErrorMessages.AMOUNT_MUST_BE_POSITIVE,
                ErrorMessages.AMOUNT_MUST_BE_FINITE,
                ErrorMessages.CURRENCY_INVALID,
                'Unexpected fields: extra1, extra2'
            ]
        ],
        [
            {}, 
            [ErrorMessages.AMOUNT_REQUIRED, ErrorMessages.CURRENCY_REQUIRED]
        ]
    ])('returns invalid for input %p with errors %p', (input, expectedErrors) => {
        const result = validatePaymentInput(input);
        expect(result.isValid).toBe(false);
        expectedErrors.forEach(err => {
            expect(result.errors).toContain(err);
        });
    });

    test.each([
        ['USD'],
        ['AUD'],
        ['EUR'],
        ['GBP'],
        ['SGD'],
    ])('accepts valid currency %s', (currency) => {
        const result = validatePaymentInput({ amount: 1000, currency });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    test.each([
        99.99,
        0.01,
        999999.99
    ])('accepts valid amount %p', (amount) => {
        const result = validatePaymentInput({ amount, currency: 'USD' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });
});
