import { AxiosError } from 'axios';
import React from 'react';

export interface ErrorWithMessage {
  message: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  code?: string;
  validationErrors?: ValidationError[];
}

export const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
};

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
};

export const toErrorWithMessage = (maybeError: unknown): ErrorWithMessage => {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example
    return new Error(String(maybeError));
  }
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response?.data && isApiError(error.response.data)) {
      return error.response.data.message;
    }
    return error.message;
  }
  return toErrorWithMessage(error).message;
};

export const getValidationErrors = (error: unknown): ValidationError[] => {
  if (error instanceof AxiosError && error.response?.data && isApiError(error.response.data)) {
    return error.response.data.validationErrors || [];
  }
  return [];
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly retryCount: number = 0,
    public readonly maxRetries: number = 3
  ) {
    super(message);
    this.name = 'RetryableError';
  }

  canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }

  nextRetry(): RetryableError {
    return new RetryableError(this.message, this.retryCount + 1, this.maxRetries);
  }

  getBackoffTime(): number {
    return Math.min(1000 * Math.pow(2, this.retryCount), 10000);
  }
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let error = new RetryableError('Initial attempt', 0, maxRetries);

  while (error.canRetry()) {
    try {
      return await operation();
    } catch (e) {
      error = error.nextRetry();
      if (!error.canRetry()) throw e;
      await new Promise(resolve => setTimeout(resolve, error.getBackoffTime()));
    }
  }

  throw error;
};

export const createErrorBoundary = (
  fallback: React.ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      if (onError) {
        onError(error, errorInfo);
      }
    }

    render() {
      if (this.state.hasError) {
        return fallback;
      }

      return this.props.children;
    }
  };
};
