import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { buildResponse } from './lib/apigateway';
import { listPayments } from './lib/payments';
import { Currency } from './lib/validation';

const isValidCurrency = (value: string): value is Currency => {
    return Object.values(Currency).includes(value as Currency);
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const currency = event.queryStringParameters?.currency;
        
        // Validate currency format if provided
        if (currency && !isValidCurrency(currency)) {
            return buildResponse(400, { 
                error: 'Invalid currency format. Currency must be a 3-letter uppercase code (e.g., USD, EUR, GBP)' 
            });
        }

        const payments = await listPayments(currency);
        
        return buildResponse(200, { 
            data: payments,
            count: payments.length,
            filters: currency ? { currency } : {}
        });
    } catch (error) {
        console.error('Error listing payments:', error);
        return buildResponse(500, { error: 'Internal server error' });
    }
};