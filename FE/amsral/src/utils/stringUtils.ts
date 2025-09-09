/**
 * Utility functions for string manipulation
 */

/**
 * Formats a string by capitalizing the first letter of each word and replacing underscores/dots with spaces
 * @param text - The text to format
 * @returns Formatted text with capitalized words and spaces instead of underscores/dots
 * 
 * @example
 * formatDisplayText("user_admin") => "User Admin"
 * formatDisplayText("super.user") => "Super User"
 * formatDisplayText("admin") => "Admin"
 */
export const formatDisplayText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/[_.]/g, ' ') // Replace underscores and dots with spaces
    .split(' ') // Split into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
    .join(' '); // Join back with spaces
};

/**
 * Converts a string to title case (capitalizes first letter of each word)
 * @param text - The text to convert
 * @returns Text in title case
 * 
 * @example
 * toTitleCase("hello world") => "Hello World"
 */
export const toTitleCase = (text: string): string => {
  if (!text) return '';
  
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Removes underscores and replaces them with spaces
 * @param text - The text to format
 * @returns Text with spaces instead of underscores
 * 
 * @example
 * removeUnderscores("user_name") => "user name"
 */
export const removeUnderscores = (text: string): string => {
  if (!text) return '';
  return text.replace(/_/g, ' ');
};

/**
 * Generates a username from first name and last name
 * @param firstName - The first name
 * @param lastName - The last name
 * @returns Generated username in format "firstname lastname"
 * 
 * @example
 * generateUsername("John", "Doe") => "john doe"
 * generateUsername("Jane", "Smith") => "jane smith"
 */
export const generateUsername = (firstName: string, lastName: string): string => {
  if (!firstName && !lastName) return '';
  
  const cleanFirstName = firstName.trim().toLowerCase().replace(/\s+/g, '');
  const cleanLastName = lastName.trim().toLowerCase().replace(/\s+/g, '');
  
  if (!cleanFirstName && !cleanLastName) return '';
  if (!cleanFirstName) return cleanLastName;
  if (!cleanLastName) return cleanFirstName;
  
  return `${cleanFirstName} ${cleanLastName}`;
};
