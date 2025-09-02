/**
 * Safely parses JSON from a Response object, checking content-type first
 * and providing graceful error handling for non-JSON responses
 */
export async function safeJsonParse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')
  
  if (!contentType || !contentType.includes('application/json')) {
    // If it's not JSON, get the text for error reporting
    const text = await response.text()
    console.error('Expected JSON but received:', contentType, 'Response text:', text.slice(0, 200))
    
    // Try to extract error message from HTML if it's an error page
    if (contentType?.includes('text/html')) {
      const titleMatch = text.match(/<title>(.*?)<\/title>/i)
      const errorMessage = titleMatch ? titleMatch[1] : 'Server returned HTML instead of JSON'
      throw new Error(`API Error: ${errorMessage}`)
    }
    
    throw new Error(`Invalid response type: ${contentType || 'unknown'}`)
  }
  
  try {
    return await response.json()
  } catch (error) {
    console.error('JSON parse error:', error)
    throw new Error('Failed to parse JSON response')
  }
}

/**
 * Enhanced fetch function that handles authentication redirects and JSON parsing errors
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<unknown> {
  try {
    const response = await fetch(url, options)
    
    // Check for authentication redirects (3xx status codes to sign-in page)
    if (response.redirected && response.url.includes('/auth/signin')) {
      throw new Error('Authentication required - please sign in again')
    }
    
    // For successful responses, parse JSON safely
    if (response.ok) {
      return await safeJsonParse(response)
    }
    
    // For error responses, try to parse JSON error message
    try {
      const errorData = await safeJsonParse(response)
      const error = errorData as { error?: string }
      throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
    } catch {
      // If we can't parse the error response, throw a generic error
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error - please check your connection')
    }
    throw error
  }
}

/**
 * Checks if a response contains JSON content
 */
export function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type')
  return contentType ? contentType.includes('application/json') : false
}