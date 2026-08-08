const DEFAULT_AUTH_RETURN_URL = '/products';

export function getSafeAuthReturnUrl(url: string): string {
  const normalizedUrl = url.trim();

  if (
    !normalizedUrl.startsWith('/') ||
    normalizedUrl.startsWith('//') ||
    normalizedUrl.includes('\\')
  ) {
    return DEFAULT_AUTH_RETURN_URL;
  }

  return normalizedUrl;
}
