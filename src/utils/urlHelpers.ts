// Get the base URL for API calls.
// In ingress mode: https://host/hassio/ingress/slug
// In standalone/dev: https://host (or http://localhost:5173 with vite proxy)
export function getApiBaseUrl(): string {
  const { protocol, host, pathname } = window.location;
  // Remove trailing slash, /index.html, or hash fragments
  const cleanPath = pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
  return `${protocol}//${host}${cleanPath}`;
}
