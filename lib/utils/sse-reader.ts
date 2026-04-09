/**
 * Properly buffered SSE stream reader.
 *
 * Problem with naive approach:
 *   const text = decoder.decode(value)            // might be half a line
 *   const lines = text.split('\n')                // splits incomplete data
 *   JSON.parse(line.slice(6))                     // FAILS on truncated JSON
 *
 * This utility accumulates chunks across reads until a complete
 * SSE event (terminated by \n\n) is available before parsing.
 */

export type SSEEvent = Record<string, unknown>

export async function* readSSE(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<SSEEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // Accumulate — use { stream: true } so multi-byte chars aren't split
      buffer += decoder.decode(value, { stream: true })

      // SSE events are separated by \n\n
      // Split and keep the last (potentially incomplete) chunk in the buffer
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const event of events) {
        const dataLine = event.split('\n').find(l => l.startsWith('data: '))
        if (!dataLine) continue
        try {
          yield JSON.parse(dataLine.slice(6)) as SSEEvent
        } catch {
          // malformed event — skip silently
        }
      }
    }

    // Flush any remaining buffer after stream closes
    if (buffer.trim()) {
      const dataLine = buffer.split('\n').find(l => l.startsWith('data: '))
      if (dataLine) {
        try {
          yield JSON.parse(dataLine.slice(6)) as SSEEvent
        } catch {
          // ignore
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
