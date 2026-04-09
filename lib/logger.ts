type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

// Default to 'warn' in production, 'info' if VERBOSE_LOGS is set
function getMinLevel(): LogLevel {
  if (process.env.VERBOSE_LOGS === '1' || process.env.VERBOSE_LOGS === 'true') return 'debug'
  return 'warn'
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[getMinLevel()]
}

function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>) {
  if (!shouldLog(level)) return

  const line = JSON.stringify({
    level,
    module,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
  })

  switch (level) {
    case 'error':
      console.error(line)
      break
    case 'warn':
      console.warn(line)
      break
    default:
      console.log(line)
  }
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: Record<string, unknown>) => log('debug', module, msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log('info', module, msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log('warn', module, msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log('error', module, msg, data),
    time: (label: string) => {
      const start = performance.now()
      return {
        end: (data?: Record<string, unknown>) => {
          const durationMs = Math.round(performance.now() - start)
          log('info', module, `${label} completed`, { ...data, durationMs })
          return durationMs
        },
      }
    },
  }
}
