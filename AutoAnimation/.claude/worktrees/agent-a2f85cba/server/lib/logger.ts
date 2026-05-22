/**
 * Structured logger for the server.
 * Uses pino for JSON-structured output in production,
 * pretty-prints in development.
 */

import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? { target: 'pino/file', options: { destination: 1 } } // stdout
    : undefined,
  // In production, pino outputs JSON by default — ideal for log aggregators
})

export default logger
