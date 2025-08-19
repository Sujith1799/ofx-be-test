import { DocumentClient } from './dynamodb';
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Currency } from './validation';

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE_NAME || 'PaymentsTable';

export const getPayment = async (paymentId: string): Promise<Payment | null> => {
    try {
        const result = await DocumentClient.send(
            new GetCommand({
                TableName: PAYMENTS_TABLE,
                Key: { paymentId },
            })
        );

        return (result.Item as Payment) || null;
    } catch (error) {
        console.error(`Failed to get payment ${paymentId}:`, error);
        throw error;
    }
};

export const listPayments = async (currency?: string): Promise<Payment[]> => {
    try {
        const scanParams: any = {
            TableName: PAYMENTS_TABLE,
        };

        // Add filter expression for currency if provided
        if (currency) {
            scanParams.FilterExpression = 'currency = :currency';
            scanParams.ExpressionAttributeValues = {
                ':currency': currency
            };
        }

        const result = await DocumentClient.send(new ScanCommand(scanParams));
        return (result.Items as Payment[]) || [];
    } catch (error) {
        console.error(`Failed to list payments:`, error);
        throw error;
    }
};

export const createPayment = async (payment: Payment): Promise<void> => {
    try {
        await DocumentClient.send(
            new PutCommand({
                TableName: PAYMENTS_TABLE,
                Item: {
                    paymentId: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    createdAt: new Date().toISOString()
                },
            })
        );
    } catch (error) {
        console.error(`Failed to create payment ${payment.id}:`, error);
        throw error;
    }
};

export type Payment = {
    id: string;
    amount: number;
    currency: Currency;
    createdAt?: string;
};