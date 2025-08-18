import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { buildResponse, parseInput } from './lib/apigateway';
import { createPayment, Payment } from './lib/payments';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const input = parseInput(event.body || '{}') as Omit<Payment, 'id'>;
        
        // Generate a unique ID for the payment
        const paymentId = randomUUID();
        
        const payment: Payment = {
            id: paymentId,
            ...input
        };

        await createPayment(payment);
        
        return buildResponse(201, { 
            result: payment.id,
            payment: payment
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        return buildResponse(500, { error: 'Internal server error' });
    }
};