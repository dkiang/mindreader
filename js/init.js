// Keep the page and serverless API on the same origin for the strict CSP.
if (window.location.hostname === 'kiang.net') {
  const url = new URL(window.location.href);
  url.hostname = 'www.kiang.net';
  window.location.replace(url.href);
}

// Ensure proper base path for subdirectory deployment
const currentPath = window.location.pathname;
if (currentPath.endsWith('mindreader') && !currentPath.endsWith('/')) {
  // Redirect to trailing slash version
  window.location.replace(window.location.href + '/');
}
