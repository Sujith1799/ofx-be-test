import { DocumentClient } from './dynamodb';
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Currency } from './validation';
import { NotFoundError, PaymentError } from './errors';

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE_NAME || 'PaymentsTable';

export const getPayment = async (paymentId: string): Promise<Payment | null> => {
    try {
        const result = await DocumentClient.send(
            new GetCommand({
                TableName: PAYMENTS_TABLE,
                Key: { paymentId },
            })
        );

        // Transform DynamoDB item back to Payment format
        return result.Item ? mapItemToPayment(result.Item) : null;

    } catch (error) {
        console.error(`Failed to get payment ${paymentId}:`, error);
        throw new PaymentError(`Failed to retrieve payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const listPayments = async (currency?: string): Promise<Payment[]> => {
    try {
        const scanParams: any = {
            TableName: PAYMENTS_TABLE,
        };

        // Add filter expression for currency if provided
        if (currency) {
            scanParams.FilterExpression = '#currency = :currency';
            scanParams.ExpressionAttributeNames = {
                '#currency': 'currency'
            };
            scanParams.ExpressionAttributeValues = {
                ':currency': currency
            };
        }

        const result = await DocumentClient.send(new ScanCommand(scanParams));
        
        // Transform DynamoDB items back to Payment format
        const payments = (result.Items || []).map(mapItemToPayment);

        // Sort by creation date (newest first)
        return payments.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    } catch (error) {
        console.error(`Failed to list payments:`, error);
        throw new PaymentError(`Failed to list payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const createPayment = async (payment: Payment): Promise<void> => {
    try {
        const timestamp = new Date().toISOString();
        
        await DocumentClient.send(
            new PutCommand({
                TableName: PAYMENTS_TABLE,
                Item: {
                    paymentId: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    createdAt: timestamp,
                    updatedAt: timestamp
                },
                // Ensure we don't overwrite existing payments
                ConditionExpression: 'attribute_not_exists(paymentId)'
            })
        );
    } catch (error) {
        console.error(`Failed to create payment ${payment.id}:`, error);
        
        if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
            throw new PaymentError(`Payment with ID ${payment.id} already exists`, 409);
        }
        
        throw new PaymentError(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export type Payment = {
    id: string;
    amount: number;
    currency: Currency;
    createdAt?: string;
};


// could be in helper functions if repo gets bigger
const mapItemToPayment = (item: Record<string, any>): Payment => ({
    id: item.paymentId,
    amount: item.amount,
    currency: item.currency,
    createdAt: item.createdAt,
});