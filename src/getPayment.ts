import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { buildResponse } from './lib/apigateway';
import { getPayment } from './lib/payments';
import { ErrorMessages, BadRequestError, NotFoundError, PaymentError } from './lib/errors';

/**
 * Handler function to retrieve a payment by its ID.
 * 
 * @param event APIGatewayProxyEvent - The event object containing the request data.
 * @returns APIGatewayProxyResult - The response object containing the payment data or error message.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const paymentId = event.pathParameters?.id;
        
        if (!paymentId) {
            throw new BadRequestError(ErrorMessages.PAYMENT_ID_REQUIRED);
        }

        const payment = await getPayment(paymentId);
        
        if (!payment) {
            throw new NotFoundError(ErrorMessages.PAYMENT_NOT_FOUND);
        }

        return buildResponse(200, {
            ...payment,
            message: 'Payment retrieved successfully'
        });
    } catch (error) {
        console.error('Error retrieving payment:', error);
        
        if (error instanceof PaymentError) {
            return buildResponse(error.statusCode, { 
                error: error.message
            });
        }
        
        return buildResponse(500, { error: ErrorMessages.INTERNAL_SERVER_ERROR });
    }
};