// Ensure proper base path for subdirectory deployment
const currentPath = window.location.pathname;
if (currentPath.endsWith('mindreader') && !currentPath.endsWith('/')) {
  // Redirect to trailing slash version
  window.location.href = window.location.href + '/';
}
