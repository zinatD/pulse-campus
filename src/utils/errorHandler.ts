/**
 * Error mapping for common error codes to user-friendly messages
 */
const errorMessages: Record<string, string> = {
  // Auth errors
  'invalid_credentials': 'The email or password you entered is incorrect.',
  'user_not_found': 'No account found with this email address.',
  'email_taken': 'This email address is already in use.',
  'weak_password': 'Please use a stronger password. It should be at least 8 characters with a mix of letters, numbers, and symbols.',
  'invalid_email': 'Please enter a valid email address.',
  'email_not_confirmed': 'Please verify your email address before signing in.',
  
  // General errors
  'network_error': 'Network error. Please check your connection and try again.',
  'server_error': 'Something went wrong on our end. Please try again later.',
  'timeout': 'The request took too long to complete. Please try again.',
  'unknown': 'An unexpected error occurred. Please try again.',
  
  // Database errors
  'database_error': 'There was a problem with the database. Please try again later.',
  'not_found': 'The requested resource was not found.',
  
  // Form validation
  'required_field': 'Please fill in all required fields.',
  'passwords_dont_match': 'The passwords you entered don\'t match.',
};

/**
 * Format error message from various error sources into user-friendly messages
 */
export function formatErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Handle string errors
  if (typeof error === 'string') return error;

  // Handle Error objects
  if (error instanceof Error) return error.message;

  // Handle Supabase auth errors
  if (error.code && typeof error.code === 'string') {
    return errorMessages[error.code] || error.message || `Error: ${error.code}`;
  }

  // Handle object errors with message property
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  // Handle unexpected error formats
  return 'An unexpected error occurred';
}

/**
 * Parse API error responses into user-friendly messages
 */
export function parseApiError(error: any): { message: string; code?: string } {
  // If it's already a string, just return it
  if (typeof error === 'string') {
    return { message: error };
  }

  // Handle common API error formats
  if (error?.code && error?.message) {
    const message = errorMessages[error.code] || error.message;
    return { message, code: error.code };
  }

  // Handle unexpected error formats
  return { 
    message: formatErrorMessage(error),
    code: error?.code || 'unknown'
  };
}

export default {
  formatErrorMessage,
  parseApiError
};
