export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, code: string) {
    super(message, code);
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string, code: string) {
    super(message, code);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, code: string) {
    super(message, code);
  }
}
