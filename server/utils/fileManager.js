const fs = require('fs').promises;
const tmp = require('tmp');
const { promisify } = require('util');

const tmpFile = promisify(tmp.file);

/**
 * Create a temporary file with the given code content and extension
 * @param {string} code - The code content to write to the file
 * @param {string} extension - The file extension (e.g., '.py', '.js', '.go')
 * @returns {Promise<string>} - The filepath of the created temporary file
 */
async function createTempFile(code, extension) {
  try {
    // Create a temporary file with the specified extension
    const filepath = await tmpFile({
      prefix: 'lint-',
      postfix: extension,
      keep: true // Keep the file so we can delete it manually later
    });

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

module.exports = {
  createTempFile,
  deleteTempFile
};
