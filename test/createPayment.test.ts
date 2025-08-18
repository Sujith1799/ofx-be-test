import * as payments from '../src/lib/payments';
import { handler } from '../src/createPayment';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { Currency } from '../src/lib/validation';

describe('createPayment handler', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('creates a payment with valid input and returns generated ID', async () => {
        const createPaymentMock = jest.spyOn(payments, 'createPayment').mockResolvedValueOnce(undefined);
        
        const event = {
            body: JSON.stringify({ amount: 1000, currency: 'USD' })
        } as APIGatewayProxyEvent;

        const result = await handler(event);

        expect(result.statusCode).toBe(201);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.result).toBeDefined();
        expect(responseBody.payment.amount).toBe(1000);
        expect(responseBody.payment.currency).toBe(Currency.USD);
        expect(responseBody.payment.id).toBeDefined();
        expect(createPaymentMock).toHaveBeenCalledWith(expect.objectContaining({
            id: expect.any(String),
            amount: 1000,
            currency: Currency.USD
        }));
    });

    it('returns 422 when amount is missing', async () => {
        const event = {
            body: JSON.stringify({ currency: 'USD' })
        } as APIGatewayProxyEvent;

        const result = await handler(event);

        expect(result.statusCode).toBe(422);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toBe('Validation failed');
        expect(responseBody.details).toContain('Amount is required');
    });

    it('returns 422 when currency is missing', async () => {
        const event = {
            body: JSON.stringify({ amount: 1000 })
        } as APIGatewayProxyEvent;

        const result = await handler(event);

        expect(result.statusCode).toBe(422);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toBe('Validation failed');
        expect(responseBody.details).toContain('Currency is required');
    });

    it('returns 422 when amount is not a number', async () => {
        const event = {
            body: JSON.stringify({ amount: 'invalid', currency: 'USD' })
        } as APIGatewayProxyEvent;

        const result = await handler(event);

        expect(result.statusCode).toBe(422);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.details).toContain('Amount must be a number');
    });

    it('returns 422 when amount is zero or negative', async () => {
        const event = {
            body: JSON.stringify({ amount: 0, currency: 'USD' })
        } as APIGatewayProxyEvent;

        const result = await handler(event);

        expect(result.statusCode).toBe(422);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.details).toContain('Amount must be greater than 0');
    });

    it('returns 422 when currency format is invalid', async () => {
        const event = {
            body: JSON.stringify({ amount: 1000, currency: 'EUR' })
        } as APIGatewayProxyEvent;

        const result = await handler(event);

        expect(result.statusCode).toBe(422);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.details).toContain('Currency must be a 3-letter uppercase code');
    });

    it('returns 422 when unexpected fields are provided', async () => {
        const event = {
            body: JSON.stringify({ amount: 1000, currency: 'USD', extraField: 'value' })
        } as APIGatewayProxyEvent;

        const result = await handler(event);

        expect(result.statusCode).toBe(422);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.details).toContain('Unexpected fields: extraField');
    });

    it('accepts AUD currency', async () => {
        const createPaymentMock = jest.spyOn(payments, 'createPayment').mockResolvedValueOnce(undefined);
        
        const event = {
            body: JSON.stringify({ amount: 2000, currency: 'AUD' })
        } as APIGatewayProxyEvent;

        const result = await handler(event);

        expect(result.statusCode).toBe(201);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.payment.currency).toBe(Currency.AUD);
        expect(createPaymentMock).toHaveBeenCalledWith(expect.objectContaining({
            currency: Currency.AUD
        }));
    });
});