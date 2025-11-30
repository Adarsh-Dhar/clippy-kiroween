const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

/**
 * Execute a linter command on a file
 * @param {string} command - The linter command to execute
 * @param {Array<string>} args - Arguments to pass to the command
 * @param {string} filepath - The path to the file to lint
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
async function executeLinter(command, args, filepath, env = {}) {
  const fullCommand = `${command} ${args.join(' ')} ${filepath}`;
  
  // Merge with process.env and provided env
  const execEnv = { ...process.env, ...env };
  
  try {
    const { stdout, stderr } = await execPromise(fullCommand, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      env: execEnv
    });

    return {
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: 0
    };
  } catch (error) {
    // Check if it's a command not found error
    if (error.code === 'ENOENT' || error.message.includes('command not found') || 
        error.message.includes('not found') || error.code === 127) {
      // Don't log as error, just return empty output for missing linters
      return {
        stdout: '',
        stderr: '',
        exitCode: 127
      };
    }

    // Check if it's a timeout error
    if (error.killed && error.signal === 'SIGTERM') {
      console.error(`Linter command timed out: ${command}`);
      throw new Error(`Linter execution timed out after 30 seconds`);
    }

    // For linters, non-zero exit codes often mean lint errors were found
    // This is expected behavior, so we return the output
    if (error.code && error.stdout !== undefined) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code
      };
    }

    // Log and rethrow unexpected errors
    console.error(`Error executing linter command: ${error.message}`);
    throw error;
  }
}

module.exports = {
  executeLinter
};
