// lib/logger.ts
// Logging terpusat — ganti console.log scattered di seluruh project

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function log(level: LogLevel, message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  if (level === 'error') {
    console.error(`${prefix} ${message}`, data || '')
  } else if (level === 'warn') {
    console.warn(`${prefix} ${message}`, data || '')
  } else if (process.env.NODE_ENV !== 'production' || level === 'info') {
    console.log(`${prefix} ${message}`, data || '')
  }
}

export const logger = {
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
}
