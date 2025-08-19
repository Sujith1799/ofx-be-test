import * as payments from '../src/lib/payments';
import { randomUUID } from 'crypto';
import { handler } from '../src/getPayment';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { Currency } from '../src/lib/validation';
import { ErrorMessages, PaymentError } from '../src/lib/errors';

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
            createdAt: '2025-01-20T10:30:00.000Z'
        };
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(mockPayment);

        const result = await handler({
            pathParameters: { id: paymentId },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.id).toBe(mockPayment.id);
        expect(responseBody.amount).toBe(mockPayment.amount);
        expect(responseBody.currency).toBe(mockPayment.currency);
        expect(responseBody.createdAt).toBe(mockPayment.createdAt);
        expect(responseBody.message).toBe('Payment retrieved successfully');
        expect(getPaymentMock).toHaveBeenCalledWith(paymentId);
    });

    it('returns 404 when payment is not found', async () => {
        const paymentId = randomUUID();
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(null);

        const result = await handler({
            pathParameters: { id: paymentId },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(404);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toBe(ErrorMessages.PAYMENT_NOT_FOUND);
        expect(getPaymentMock).toHaveBeenCalledWith(paymentId);
    });

    it('returns 400 when payment ID is missing', async () => {
        const result = await handler({
            pathParameters: null,
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toBe(ErrorMessages.PAYMENT_ID_REQUIRED);
    });

    it('returns 400 when pathParameters exists but id is undefined', async () => {
        const result = await handler({
            pathParameters: { id: undefined },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toBe(ErrorMessages.PAYMENT_ID_REQUIRED);
    });

    it('returns 500 when database throws an error', async () => {
        const paymentId = randomUUID();
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockRejectedValueOnce(new Error('DB Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await handler({
            pathParameters: { id: paymentId },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toBe(ErrorMessages.INTERNAL_SERVER_ERROR);
        expect(consoleSpy).toHaveBeenCalledWith('Error retrieving payment:', expect.any(Error));
        
        consoleSpy.mockRestore();
    });

    it('handles PaymentError correctly', async () => {
        const paymentId = randomUUID();
        const customError = new PaymentError('Custom payment error', 503);
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockRejectedValueOnce(customError);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await handler({
            pathParameters: { id: paymentId },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(503);
        const responseBody = JSON.parse(result.body);
        expect(responseBody.error).toBe('Custom payment error');
        
        consoleSpy.mockRestore();
    });

    it('returns payment with all expected fields', async () => {
        const paymentId = randomUUID();
        const mockPayment = {
            id: paymentId,
            currency: Currency.USD,
            amount: 1500.25,
            createdAt: '2025-01-20T15:45:30.123Z'
        };
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(mockPayment);

        const result = await handler({
            pathParameters: { id: paymentId },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const responseBody = JSON.parse(result.body);
        
        // Verify all payment fields are present
        expect(responseBody).toHaveProperty('id', paymentId);
        expect(responseBody).toHaveProperty('amount', 1500.25);
        expect(responseBody).toHaveProperty('currency', Currency.USD);
        expect(responseBody).toHaveProperty('createdAt', '2025-01-20T15:45:30.123Z');
        expect(responseBody).toHaveProperty('message', 'Payment retrieved successfully');
        
        expect(getPaymentMock).toHaveBeenCalledWith(paymentId);
    });
});