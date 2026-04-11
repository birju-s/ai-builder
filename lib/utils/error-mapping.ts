export function mapErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred.'
  
  const msg = typeof error === 'string' 
    ? error 
    : (error instanceof Error ? error.message : String(error))
  
  if (msg.includes('Validation failed')) return 'Please check your input and try again.'
  if (msg.includes('fetch failed')) return 'We could not connect to the sandbox environment. Please try again.'
  if (msg.includes('rate limit')) return 'You have reached the rate limit. Please try again later.'
  if (msg.includes('sandbox')) return 'There was an issue setting up the secure environment. Please try again.'
  if (msg.includes('timeout')) return 'The operation took too long. Please try again.'
  if (msg.includes('ECONNREFUSED')) return 'Connection refused. The server might be down.'
  if (msg.includes('JSON')) return 'We received an invalid response from the AI. Please try rephrasing your prompt.'
  
  return msg
}
