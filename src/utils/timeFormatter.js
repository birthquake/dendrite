export function formatTimeSince(timestamp) {
  if (!timestamp) return null;

  const now = new Date();
  const secondsAgo = Math.floor((now - timestamp) / 1000);

  if (secondsAgo < 60) {
    return `Last saved ${secondsAgo} second${secondsAgo !== 1 ? 's' : ''} ago`;
  }

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return `Last saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
  }

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `Last saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7) {
    return `Last saved ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
  }

  const weeksAgo = Math.floor(daysAgo / 7);
  return `Last saved ${weeksAgo} week${weeksAgo !== 1 ? 's' : ''} ago`;
}
