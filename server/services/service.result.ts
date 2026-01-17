export enum ServiceErrorCode {
  success,
  failed,
  conflict,
  notFound,
  invalidParameter,
}

export class ServiceResult<R = unknown> {
  readonly result: R | undefined;
  readonly errorCode: ServiceErrorCode;

  constructor(result: R | undefined, errorCode: ServiceErrorCode) {
    this.result = result;
    this.errorCode = errorCode;
  }

  static success<R>(result: R): ServiceResult<R> {
    return new ServiceResult<R>(result, ServiceErrorCode.success);
  }

  static failed<R>(): ServiceResult<R> {
    return new ServiceResult<R>(undefined, ServiceErrorCode.failed);
  }

  static conflict<R>(): ServiceResult<R> {
    return new ServiceResult<R>(undefined, ServiceErrorCode.conflict);
  }

  static notFound<R>(): ServiceResult<R> {
    return new ServiceResult<R>(undefined, ServiceErrorCode.notFound);
  }

  static invalidParameter<R>(): ServiceResult<R> {
    return new ServiceResult<R>(undefined, ServiceErrorCode.invalidParameter);
  }
}

// Types pour la nouvelle API
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper functions pour le nouveau pattern
export function success<T>(data: T): ServiceResponse<T> {
  return {
    success: true,
    data,
  };
}

export function failure<T = never>(error: string): ServiceResponse<T> {
  return {
    success: false,
    error,
  };
}
