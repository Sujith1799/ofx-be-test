import * as cdk from 'aws-cdk-lib';
import { Cors, LambdaIntegration, RestApi, RequestValidator, Model, JsonSchemaType, JsonSchemaVersion } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Currency } from '../src/lib/validation';

export class BeTestStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Dynamo DB table
        const paymentsTable = new Table(this, 'PaymentsTable', {
            tableName: 'PaymentsTable',
            partitionKey: { name: 'paymentId', type: AttributeType.STRING },
            billingMode: BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test environments
        });

        const paymentsApi = new RestApi(this, 'ofxPaymentsChallenge', {
            restApiName: 'OFX Payments API',
            description: 'API for managing payments in the OFX system',
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
            },
        });

        // Request validation models
        const paymentInputModel = new Model(this, 'PaymentInputModel', {
            restApi: paymentsApi,
            modelName: 'PaymentInput',
            contentType: 'application/json',
            schema: {
                schema: JsonSchemaVersion.DRAFT4,
                type: JsonSchemaType.OBJECT,
                properties: {
                    amount: {
                        type: JsonSchemaType.NUMBER,
                        minimum: 0.01,
                        maximum: 1000000
                    },
                    currency: {
                        type: JsonSchemaType.STRING,
                        enum: [Currency.USD, Currency.AUD, Currency.EUR, Currency.GBP, Currency.SGD]
                    }
                },
                required: ['amount', 'currency'],
                additionalProperties: false
            }
        });

        const requestValidator = new RequestValidator(this, 'RequestValidator', {
            restApi: paymentsApi,
            requestValidatorName: 'PaymentRequestValidator',
            validateRequestBody: true,
            validateRequestParameters: true,
        });

        // API Resources
        const paymentsResource = paymentsApi.root.addResource('payments');
        const specificPaymentResource = paymentsResource.addResource('{id}');

        const createPaymentFunction = this.createLambda('createPayment', 'src/createPayment.ts', paymentsTable.tableName);
        paymentsTable.grantWriteData(createPaymentFunction);
        paymentsResource.addMethod('POST', new LambdaIntegration(createPaymentFunction), {
            requestValidator,
            requestModels: {
                'application/json': paymentInputModel
            }
        });

        const getPaymentFunction = this.createLambda('getPayment', 'src/getPayment.ts', paymentsTable.tableName);
        paymentsTable.grantReadData(getPaymentFunction);
        specificPaymentResource.addMethod('GET', new LambdaIntegration(getPaymentFunction), {
            requestParameters: {
                'method.request.path.id': true
            }
        });

        const listPaymentsFunction = this.createLambda('listPayments', 'src/listPayments.ts', paymentsTable.tableName);
        paymentsTable.grantReadData(listPaymentsFunction);
        paymentsResource.addMethod('GET', new LambdaIntegration(listPaymentsFunction), {
            requestParameters: {
                'method.request.querystring.currency': false
            }
        });

        // Stack Outputs
        new cdk.CfnOutput(this, 'ApiGatewayUrl', {
            value: paymentsApi.url,
            description: 'API Gateway endpoint URL for Payments API',
        });

        new cdk.CfnOutput(this, 'PaymentsTableName', {
            value: paymentsTable.tableName,
            description: 'DynamoDB table name for payments',
        });
    }

    createLambda = (name: string, path: string, tableName: string) => {
        return new NodejsFunction(this, name, {
            functionName: name,
            runtime: Runtime.NODEJS_18_X,
            entry: path,
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            tracing: Tracing.ACTIVE,
            environment: {
                PAYMENTS_TABLE_NAME: tableName,
                NODE_ENV: 'production'
            },
            bundling: {
                minify: true,
                sourceMap: true,
                target: 'es2020'
            }
        });
    };
}