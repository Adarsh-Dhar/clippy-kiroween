const fs = require('fs').promises;
const tmp = require('tmp');
const { promisify } = require('util');

const tmpFile = promisify(tmp.file);

/**
 * Create a temporary file with the given code content and extension
 * @param {string} code - The code content to write to the file
 * @param {string} extension - The file extension (e.g., '.py', '.js', '.go')
 * @param {string} customName - Optional custom filename (without extension) for Java files
 * @returns {Promise<string>} - The filepath of the created temporary file
 */
async function createTempFile(code, extension, customName = null) {
  try {
    let filepath;
    
    if (customName) {
      // For Java files with custom class names, create file in temp directory with specific name
      const os = require('os');
      const path = require('path');
      const tempDir = os.tmpdir();
      // Sanitize custom name to prevent directory traversal
      const safeName = customName.replace(/[^a-zA-Z0-9_]/g, '');
      filepath = path.join(tempDir, `${safeName}${extension}`);
    } else {
      // Create a temporary file with the specified extension
      filepath = await tmpFile({
        prefix: 'lint-',
        postfix: extension,
        keep: true // Keep the file so we can delete it manually later
      });
    }

    // Write the code content to the file
    await fs.writeFile(filepath, code, 'utf8');

    return filepath;
  } catch (error) {
    console.error('Error creating temporary file:', error);
    throw new Error(`Failed to create temporary file: ${error.message}`);
  }
}

/**
 * Delete a temporary file
 * @param {string} filepath - The path to the file to delete
 * @returns {Promise<void>}
 */
async function deleteTempFile(filepath) {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    // Gracefully handle if file doesn't exist
    if (error.code !== 'ENOENT') {
      console.error('Error deleting temporary file:', error);
    }
  }
}

/**
 * Extract Java class name from code
 * @param {string} code - The Java code to extract class name from
 * @returns {string} - The extracted class name or 'Main' if not found
 */
function extractJavaClassName(code) {
  // Match public class declaration
  const match = code.match(/public\s+class\s+(\w+)/);
  
  if (match && match[1]) {
    // Sanitize class name to prevent directory traversal attacks
    return match[1].replace(/[^a-zA-Z0-9_]/g, '');
  }
  
  // Default to Main if no public class found
  return 'Main';
}

module.exports = {
  createTempFile,
  deleteTempFile,
  extractJavaClassName
};
