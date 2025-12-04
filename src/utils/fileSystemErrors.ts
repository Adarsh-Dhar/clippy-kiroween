// Windows 95-style error codes
export const FILE_ERROR_CODES = {
  INVALID_NAME: '0x8007007B',
  FILE_NOT_FOUND: '0x80070002',
  ACCESS_DENIED: '0x80070005',
  DISK_FULL: '0x80070070',
  FILE_EXISTS: '0x80070050',
  PATH_TOO_LONG: '0x800700CE',
  PATH_NOT_FOUND: '0x80070003',
} as const;

// Reserved Windows file names
const RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
];

// Invalid characters for file names
const INVALID_CHARS = /[<>:"/\\|?*]/;

/**
 * Validates a file name according to Windows 95 rules
 * @param fileName - The file name to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateFileName(fileName: string): { isValid: boolean; error?: string; code?: string } {
  // Check if empty or only whitespace
  if (!fileName || fileName.trim().length === 0) {
    return {
      isValid: false,
      error: 'The filename cannot be empty.',
      code: FILE_ERROR_CODES.INVALID_NAME,
    };
  }

  // Check length (255 characters max)
  if (fileName.length > 255) {
    return {
      isValid: false,
      error: 'The filename is too long.',
      code: FILE_ERROR_CODES.INVALID_NAME,
    };
  }

  // Check for invalid characters
  if (INVALID_CHARS.test(fileName)) {
    return {
      isValid: false,
      error: 'The filename contains invalid characters. A filename cannot contain any of the following characters: \\ / : * ? " < > |',
      code: FILE_ERROR_CODES.INVALID_NAME,
    };
  }

  // Check for reserved names
  const nameWithoutExt = fileName.split('.')[0].toUpperCase();
  if (RESERVED_NAMES.includes(nameWithoutExt)) {
    return {
      isValid: false,
      error: `The filename "${fileName}" is a reserved device name and cannot be used.`,
      code: FILE_ERROR_CODES.INVALID_NAME,
    };
  }

  // Check if ends with space or period (not allowed in Windows)
  if (fileName.endsWith(' ') || fileName.endsWith('.')) {
    return {
      isValid: false,
      error: 'The filename cannot end with a space or period.',
      code: FILE_ERROR_CODES.INVALID_NAME,
    };
  }

  return { isValid: true };
}

/**
 * Validates a full file path
 * @param path - The path to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePath(path: string): { isValid: boolean; error?: string; code?: string } {
  // Check total path length (260 characters max in Windows)
  if (path.length > 260) {
    return {
      isValid: false,
      error: 'The path is too long. The path must be less than 260 characters.',
      code: FILE_ERROR_CODES.PATH_TOO_LONG,
    };
  }

  // Validate each part of the path
  const parts = path.split('/').filter(p => p !== '');
  for (const part of parts) {
    const validation = validateFileName(part);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

/**
 * Gets a user-friendly error message for an error type
 * @param errorType - The type of error
 * @returns User-friendly error message
 */
export function getErrorMessage(errorType: string): string {
  const messages: { [key: string]: string } = {
    INVALID_NAME: 'The filename, directory name, or volume label syntax is incorrect.',
    FILE_NOT_FOUND: 'The system cannot find the file specified.',
    ACCESS_DENIED: 'Access is denied.',
    DISK_FULL: 'There is not enough space on the disk.',
    FILE_EXISTS: 'The file already exists.',
    PATH_TOO_LONG: 'The specified path is too long.',
    PATH_NOT_FOUND: 'The system cannot find the path specified.',
  };

  return messages[errorType] || 'An unknown error occurred.';
}

/**
 * Formats file size in bytes to a readable format
 * @param bytes - Size in bytes
 * @returns Formatted string like "1,234 bytes (1.2 KB)"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  if (bytes === 1) return '1 byte';
  if (bytes < 1024) return `${bytes} bytes`;
  
  const kb = (bytes / 1024).toFixed(2);
  return `${bytes.toLocaleString()} bytes (${kb} KB)`;
}

/**
 * Formats a date for display in file properties
 * @param date - The date to format
 * @returns Formatted date string like "December 4, 2025, 3:45 PM"
 */
export function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a date for file list display
 * @param date - The date to format
 * @returns Formatted date string like "12/04/2025"
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

/**
 * Gets the file extension from a filename
 * @param fileName - The file name
 * @returns The extension including the dot (e.g., ".txt") or empty string
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return fileName.substring(lastDot);
}

/**
 * Checks if a file extension is recognized
 * @param extension - The extension to check (with or without dot)
 * @param associations - Map of file associations
 * @returns True if the extension has an association
 */
export function isExtensionRecognized(extension: string, associations: Map<string, string>): boolean {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return associations.has(ext);
}
