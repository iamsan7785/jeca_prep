export function isAttemptExpired(expiresAt: Date, now = new Date()) {
  return now.getTime() >= expiresAt.getTime();
}