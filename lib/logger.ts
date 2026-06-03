type LogDetails = Record<string, unknown>;

function write(level: "error" | "info" | "warn", event: string, details: LogDetails = {}) {
  const entry = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
  console[level](entry);
}

export const logger = {
  error: (event: string, details?: LogDetails) => write("error", event, details),
  info: (event: string, details?: LogDetails) => write("info", event, details),
  warn: (event: string, details?: LogDetails) => write("warn", event, details),
};
