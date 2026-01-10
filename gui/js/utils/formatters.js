/**
 * Format Utilities
 * Date, time, and value formatting helpers
 */

const formatters = {
  // Format ISO 8601 timestamp to readable format
  timestamp(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString();
  },

  // Format ISO 8601 date to short format
  date(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString();
  },

  // Format relative time (e.g., "2 hours ago")
  relative(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return this.date(isoString);
  },

  // Format entity ID with formatting
  entityId(id) {
    return `<code>${id}</code>`;
  },

  // Format bytes to human readable
  bytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },
};
