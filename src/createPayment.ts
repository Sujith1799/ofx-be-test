import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { buildResponse, parseInput } from './lib/apigateway';
import { createPayment, Payment } from './lib/payments';
import { validatePaymentInput, PaymentInput } from './lib/validation';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const input = parseInput(event.body || '{}');
        
        // Validate the input
        const validation = validatePaymentInput(input);
        if (!validation.isValid) {
            return buildResponse(422, { 
                error: 'Validation failed',
                details: validation.errors
            });
        }

        const validatedInput = input as PaymentInput;
        
        // Generate a unique ID for the payment
        const paymentId = randomUUID();
        
        const payment: Payment = {
            id: paymentId,
            amount: validatedInput.amount,
            currency: validatedInput.currency
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