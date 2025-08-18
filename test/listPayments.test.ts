import * as payments from '../src/lib/payments';
import { handler } from '../src/listPayments';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { Currency } from '../src/lib/validation';

describe('listPayments handler', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns all payments when no currency filter is provided', async () => {
        const mockPayments = [
            { id: '1', amount: 1000, currency: Currency.USD },
            { id: '2', amount: 2000, currency: Currency.AUD }
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
        expect(listPaymentsMock).toHaveBeenCalledWith(undefined);
    });

    it('returns filtered payments when currency is provided', async () => {
        const mockPayments = [
            { id: '1', amount: 1000, currency: Currency.USD }
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
        expect(listPaymentsMock).toHaveBeenCalledWith('USD');
    });

    it('returns 400 when currency format is invalid', async () => {
        const result = await handler({
            queryStringParameters: { currency: 'EUR' }
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toContain('Invalid currency format');
    });

    it('accepts AUD currency filter', async () => {
        const mockPayments = [
            { id: '2', amount: 2000, currency: Currency.AUD }
        ];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce(mockPayments);

        const result = await handler({
            queryStringParameters: { currency: 'AUD' }
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.data).toEqual(mockPayments);
        expect(responseBody.count).toBe(1);
        expect(responseBody.filters).toEqual({ currency: 'AUD' });
        expect(listPaymentsMock).toHaveBeenCalledWith('AUD');
    });

    it('returns 500 when database throws an error', async () => {
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockRejectedValueOnce(new Error('DB Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await handler({
            queryStringParameters: null
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toEqual({ error: 'Internal server error' });
        
        consoleSpy.mockRestore();
    });
});