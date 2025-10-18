import { supabase } from '@/lib/supabase';

/**
 * Check if an email already exists in the users table
 * @param email - Email address to check
 * @returns Promise<boolean> - true if email exists, false otherwise
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Error checking email:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    return false;
  }
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns boolean - true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Comprehensive email validation
 * @param email - Email address to validate
 * @returns Promise<{ isValid: boolean; error?: string }>
 */
export async function validateEmail(
  email: string
): Promise<{ isValid: boolean; error?: string }> {
  // Check if email is provided
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  // Check email format
  if (!isValidEmail(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Check if email already exists
  const exists = await checkEmailExists(email);
  if (exists) {
    return { isValid: false, error: 'This email already exists' };
  }

  return { isValid: true };
}
