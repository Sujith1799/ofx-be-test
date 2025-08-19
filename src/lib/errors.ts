export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ValidationError extends PaymentError {
  constructor(
    message: string = 'Validation failed',
    public readonly errors: string[] = []
  ) {
    super(message, 422);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends PaymentError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends PaymentError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

export const ErrorMessages = {
  PAYMENT_ID_REQUIRED: 'Payment ID is required',
  PAYMENT_NOT_FOUND: 'Payment not found',
  VALIDATION_FAILED: 'Validation failed',
  AMOUNT_REQUIRED: 'Amount is required',
  AMOUNT_MUST_BE_NUMBER: 'Amount must be a number',
  AMOUNT_MUST_BE_POSITIVE: 'Amount must be greater than 0',
  AMOUNT_MUST_BE_FINITE: 'Amount must be a finite number',
  CURRENCY_REQUIRED: 'Currency is required',
  CURRENCY_MUST_BE_STRING: 'Currency must be a string',
  CURRENCY_INVALID: 'Currency must be one of: USD, AUD, EUR, GBP, SGD',
  INVALID_INPUT_FORMAT: 'Invalid input format',
  UNEXPECTED_FIELDS: 'Unexpected fields provided',
  INTERNAL_SERVER_ERROR: 'Internal server error'
} as const;