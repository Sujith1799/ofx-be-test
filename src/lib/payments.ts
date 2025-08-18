import { DocumentClient } from './dynamodb';
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Currency } from './validation';

export const getPayment = async (paymentId: string): Promise<Payment | null> => {
    const result = await DocumentClient.send(
        new GetCommand({
            TableName: 'Payments',
            Key: { id: paymentId },
        })
    );

    return (result.Item as Payment) || null;
};

export const listPayments = async (currency?: string): Promise<Payment[]> => {
    const scanParams: any = {
        TableName: 'Payments',
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
};

export const createPayment = async (payment: Payment) => {
    await DocumentClient.send(
        new PutCommand({
            TableName: 'Payments',
            Item: payment,
        })
    );
};

export type Payment = {
    id: string;
    amount: number;
    currency: Currency;
};