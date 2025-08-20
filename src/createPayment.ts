import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { buildResponse, parseInput } from './lib/apigateway';
import { createPayment, Payment } from './lib/payments';
import { validatePaymentInput, PaymentInput } from './lib/validation';
import { ErrorMessages, ValidationError, PaymentError } from './lib/errors';

/**
 * Handler function to create a new payment.
 * 
 * @param event APIGatewayProxyEvent - The event object containing the request data.
 * @returns APIGatewayProxyResult - The response object containing the payment ID or error message.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const input = parseInput(event.body || '{}');
        
        // Validate the input
        const validation = validatePaymentInput(input);
        if (!validation.isValid) {
            throw new ValidationError(ErrorMessages.VALIDATION_FAILED, validation.errors);
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
            payment: payment,
            message: 'Payment created successfully'
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        
        if (error instanceof PaymentError) {
            return buildResponse(error.statusCode, { 
                error: error.message,
                ...(error instanceof ValidationError && { details: error.errors })
            });
        }
        
        return buildResponse(500, { error: ErrorMessages.INTERNAL_SERVER_ERROR });
    }
};