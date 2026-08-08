import { HttpErrorResponse } from '@angular/common/http';

import { isRecord } from './is-record';

/**
 * Reads the API's optional message while keeping UI state safe for unknown
 * transport errors and malformed server payloads.
 */
export function getHttpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && isRecord(error.error)) {
    const message = error.error['message'];

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}
