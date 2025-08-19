import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { buildResponse } from './lib/apigateway';
import { listPayments } from './lib/payments';
import { Currency } from './lib/validation';
import { ErrorMessages, BadRequestError, PaymentError } from './lib/errors';

const isValidCurrency = (value: string): value is Currency => {
    return Object.values(Currency).includes(value as Currency);
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const currency = event.queryStringParameters?.currency;
        
        // Validate currency format if provided
        if (currency && !isValidCurrency(currency)) {
            throw new BadRequestError(
                `Invalid currency format. Currency must be one of: ${Object.values(Currency).join(', ')}`
            );
        }

        const payments = await listPayments(currency);
        
        return buildResponse(200, { 
            data: payments,
            count: payments.length,
            filters: currency ? { currency } : {},
            message: `Successfully retrieved ${payments.length} payment${payments.length !== 1 ? 's' : ''}${currency ? ` for currency ${currency}` : ''}`
        });
    } catch (error) {
        console.error('Error listing payments:', error);
        
        if (error instanceof PaymentError) {
            return buildResponse(error.statusCode, { 
                error: error.message
            });
        }
        
        return buildResponse(500, { error: ErrorMessages.INTERNAL_SERVER_ERROR });
    }
};