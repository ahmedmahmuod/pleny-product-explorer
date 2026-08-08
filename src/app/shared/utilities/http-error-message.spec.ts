import { HttpErrorResponse } from '@angular/common/http';

import { getHttpErrorMessage } from './http-error-message';

describe('getHttpErrorMessage', () => {
  it('returns a non-empty server message when one is available', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { message: 'The request is invalid.' },
    });

    expect(getHttpErrorMessage(error, 'Fallback')).toBe('The request is invalid.');
  });

  it('returns the fallback for missing or malformed server messages', () => {
    expect(getHttpErrorMessage(new Error('offline'), 'Fallback')).toBe('Fallback');
    expect(
      getHttpErrorMessage(
        new HttpErrorResponse({ status: 500, error: { message: '   ' } }),
        'Fallback',
      ),
    ).toBe('Fallback');
  });
});
