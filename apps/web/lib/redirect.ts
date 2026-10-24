/**
 * Returns `path` if it is a same-origin relative path, otherwise `fallback`.
 * Guards the `?next=` login parameter against open redirects.
 */
export function safeRedirectPath(path: unknown, fallback: string): string {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.startsWith('/\\')
  ) {
    return fallback;
  }
  return path;
}
