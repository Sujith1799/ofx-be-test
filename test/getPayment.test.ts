import * as payments from '../src/lib/payments';
import { randomUUID } from 'crypto';
import { handler } from '../src/getPayment';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { Currency } from '../src/lib/validation';

describe('getPayment handler', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns the payment matching the input parameter', async () => {
        const paymentId = randomUUID();
        const mockPayment = {
            id: paymentId,
            currency: Currency.AUD,
            amount: 2000,
        };
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(mockPayment);

        const result = await handler({
            pathParameters: { id: paymentId },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(mockPayment);
        expect(getPaymentMock).toHaveBeenCalledWith(paymentId);
    });

    it('returns 404 when payment is not found', async () => {
        const paymentId = randomUUID();
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(null);

        const result = await handler({
            pathParameters: { id: paymentId },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body)).toEqual({ error: 'Payment not found' });
        expect(getPaymentMock).toHaveBeenCalledWith(paymentId);
    });

    it('returns 400 when payment ID is missing', async () => {
        const result = await handler({
            pathParameters: null,
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({ error: 'Payment ID is required' });
    });

    it('returns 500 when database throws an error', async () => {
        const paymentId = randomUUID();
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockRejectedValueOnce(new Error('DB Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await handler({
            pathParameters: { id: paymentId },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toEqual({ error: 'Internal server error' });
        expect(consoleSpy).toHaveBeenCalledWith('Error retrieving payment:', expect.any(Error));
        
        consoleSpy.mockRestore();
    });
});