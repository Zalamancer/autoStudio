/**
 * Lightweight logger utility that no-ops in production builds.
 * Usage: import { logger } from '@/utils/logger'
 *        logger.log('message')
 *        logger.warn('warning')
 *        logger.error('error')
 *        logger.debug('debug info')
 *        logger.group('section')
 *        logger.groupEnd()
 */

const isProd = import.meta.env.PROD

const noop = () => {}

export const logger = {
  log: isProd ? noop : console.log.bind(console),
  warn: isProd ? noop : console.warn.bind(console),
  error: isProd ? noop : console.error.bind(console),
  debug: isProd ? noop : console.debug.bind(console),
  info: isProd ? noop : console.info.bind(console),
  group: isProd ? noop : console.group.bind(console),
  groupEnd: isProd ? noop : console.groupEnd.bind(console),
  time: isProd ? noop : console.time.bind(console),
  timeEnd: isProd ? noop : console.timeEnd.bind(console),
  table: isProd ? noop : console.table.bind(console),
}
