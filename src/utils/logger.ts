/**
 * Logger utility con timestamp
 */

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString();
}

export const logger = {
  log: (...args: any[]) => {
    console.log(`[${getTimestamp()}]`, ...args);
  },
  warn: (...args: any[]) => {
    console.warn(`[${getTimestamp()}]`, ...args);
  },
  error: (...args: any[]) => {
    console.error(`[${getTimestamp()}]`, ...args);
  }
};
