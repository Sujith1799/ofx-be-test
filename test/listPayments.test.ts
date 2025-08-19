import * as payments from '../src/lib/payments';
import { handler } from '../src/listPayments';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { Currency } from '../src/lib/validation';
import { ErrorMessages, PaymentError } from '../src/lib/errors';

describe('listPayments handler', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns all payments when no currency filter is provided', async () => {
        const mockPayments = [
            { id: '1', amount: 1000, currency: Currency.USD, createdAt: '2025-01-20T10:00:00Z' },
            { id: '2', amount: 2000, currency: Currency.AUD, createdAt: '2025-01-20T11:00:00Z' }
        ];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce(mockPayments);

        const result = await handler({
            queryStringParameters: null
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.data).toEqual(mockPayments);
        expect(responseBody.count).toBe(2);
        expect(responseBody.filters).toEqual({});
        expect(responseBody.message).toBe('Successfully retrieved 2 payments');
        expect(listPaymentsMock).toHaveBeenCalledWith(undefined);
    });

    it('returns filtered payments when currency is provided', async () => {
        const mockPayments = [
            { id: '1', amount: 1000, currency: Currency.USD, createdAt: '2025-01-20T10:00:00Z' }
        ];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce(mockPayments);

        const result = await handler({
            queryStringParameters: { currency: 'USD' }
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.data).toEqual(mockPayments);
        expect(responseBody.count).toBe(1);
        expect(responseBody.filters).toEqual({ currency: 'USD' });
        expect(responseBody.message).toBe('Successfully retrieved 1 payment for currency USD');
        expect(listPaymentsMock).toHaveBeenCalledWith('USD');
    });

    it('returns 400 when currency format is invalid', async () => {
        const result = await handler({
            queryStringParameters: { currency: 'INVALID' }
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toContain('Invalid currency format');
        expect(responseBody.error).toContain('USD, AUD, EUR, GBP, SGD');
    });

    it('accepts all supported currencies as filters', async () => {
        const currencies = ['USD', 'AUD', 'EUR', 'GBP', 'SGD'];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValue([]);
        
        for (const currency of currencies) {
            const result = await handler({
                queryStringParameters: { currency }
            } as unknown as APIGatewayProxyEvent);

            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.filters).toEqual({ currency });
        }
        
        expect(listPaymentsMock).toHaveBeenCalledTimes(currencies.length);
    });

    it('returns empty array when no payments match filter', async () => {
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce([]);

        const result = await handler({
            queryStringParameters: { currency: 'USD' }
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.data).toEqual([]);
        expect(responseBody.count).toBe(0);
        expect(responseBody.filters).toEqual({ currency: 'USD' });
        expect(responseBody.message).toBe('Successfully retrieved 0 payments for currency USD');
        expect(listPaymentsMock).toHaveBeenCalledWith('USD');
    });

    it('handles singular vs plural message correctly', async () => {
        const listPaymentsMock = jest.spyOn(payments, 'listPayments');
        
        // Test singular
        listPaymentsMock.mockResolvedValueOnce([
            { id: '1', amount: 1000, currency: Currency.USD, createdAt: '2025-01-20T10:00:00Z' }
        ]);
        
        let result = await handler({
            queryStringParameters: null
        } as unknown as APIGatewayProxyEvent);
        
        let responseBody = JSON.parse(result.body);
        expect(responseBody.message).toBe('Successfully retrieved 1 payment');
        
        // Test plural
        listPaymentsMock.mockResolvedValueOnce([
            { id: '1', amount: 1000, currency: Currency.USD, createdAt: '2025-01-20T10:00:00Z' },
            { id: '2', amount: 2000, currency: Currency.AUD, createdAt: '2025-01-20T11:00:00Z' }
        ]);
        
        result = await handler({
            queryStringParameters: null
        } as unknown as APIGatewayProxyEvent);
        
        responseBody = JSON.parse(result.body);
        expect(responseBody.message).toBe('Successfully retrieved 2 payments');
    });

    it('returns 500 when database throws an error', async () => {
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockRejectedValueOnce(new Error('DB Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await handler({
            queryStringParameters: null
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toBe(ErrorMessages.INTERNAL_SERVER_ERROR);
        expect(consoleSpy).toHaveBeenCalledWith('Error listing payments:', expect.any(Error));
        
        consoleSpy.mockRestore();
    });

    it('handles PaymentError correctly', async () => {
        const customError = new PaymentError('Custom payment error', 503);
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockRejectedValueOnce(customError);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await handler({
            queryStringParameters: null
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(503);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toBe('Custom payment error');
        
        consoleSpy.mockRestore();
    });

    it('ignores other query parameters', async () => {
        const mockPayments = [
            { id: '1', amount: 1000, currency: Currency.USD, createdAt: '2025-01-20T10:00:00Z' }
        ];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce(mockPayments);

        const result = await handler({
            queryStringParameters: { 
                currency: 'USD',
                limit: '10',
                offset: '0'
            }
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.filters).toEqual({ currency: 'USD' }); // Only currency should be in filters
        expect(listPaymentsMock).toHaveBeenCalledWith('USD');
    });
});