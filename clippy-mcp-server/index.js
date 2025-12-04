#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging utility - writes only to stderr
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${level}] ${message}`, ...args);
}

// Create MCP Server instance
const server = new Server(
  {
    name: 'clippy-ghost-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool schemas
const HauntDesktopSchema = z.object({
  filename: z.string().describe('Name of the file to create on desktop'),
  content: z.string().describe('Text content to write into the file'),
});

const PlaySystemSoundSchema = z.object({
  type: z.enum(['error', 'warning', 'success']).describe('Type of system sound to play'),
});

const ReadProjectContextSchema = z.object({
  directoryPath: z.string().describe('Absolute or relative path to directory to inspect'),
});

const ManageMemorySchema = z.object({
  action: z.enum(['read', 'write']).describe('Operation to perform'),
  key: z.string().describe('Memory key to read or write'),
  value: z.string().optional().describe('Value to write (required for write action)'),
});


// Tool Implementation: haunt_desktop
function getDesktopPath() {
  const homeDir = os.homedir();
  const platform = os.platform();
  
  // All platforms use /Desktop or \Desktop
  return path.join(homeDir, 'Desktop');
}

async function hauntDesktop(args) {
  try {
    const { filename, content } = HauntDesktopSchema.parse(args);
    
    const desktopPath = getDesktopPath();
    const filePath = path.join(desktopPath, filename);
    
    log('DEBUG', `Haunting desktop with file: ${filePath}`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    const successMessage = `File created at ${filePath}`;
    log('INFO', successMessage);
    
    return {
      content: [{
        type: 'text',
        text: successMessage,
      }],
    };
  } catch (error) {
    log('ERROR', `haunt_desktop failed: ${error.message}`);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`,
      }],
      isError: true,
    };
  }
}


// Tool Implementation: play_system_sound
function getSoundCommand(soundType) {
  const platform = os.platform();
  
  const soundMappings = {
    win32: {
      error: 'C:\\Windows\\Media\\Windows Error.wav',
      warning: 'C:\\Windows\\Media\\Windows Notify.wav',
      success: 'C:\\Windows\\Media\\tada.wav',
    },
    darwin: {
      error: '/System/Library/Sounds/Basso.aiff',
      warning: '/System/Library/Sounds/Funk.aiff',
      success: '/System/Library/Sounds/Glass.aiff',
    },
  };
  
  if (platform === 'win32') {
    const soundPath = soundMappings.win32[soundType];
    return `powershell -c "(New-Object Media.SoundPlayer '${soundPath}').PlaySync()"`;
  } else if (platform === 'darwin') {
    const soundPath = soundMappings.darwin[soundType];
    return `afplay "${soundPath}"`;
  } else {
    // Linux or unknown - use terminal bell
    return 'echo -e "\\a"';
  }
}

async function playSystemSound(args) {
  try {
    const { type } = PlaySystemSoundSchema.parse(args);
    
    const command = getSoundCommand(type);
    log('DEBUG', `Playing ${type} sound with command: ${command}`);
    
    return new Promise((resolve) => {
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          log('ERROR', `Sound playback failed: ${error.message}`);
          resolve({
            content: [{
              type: 'text',
              text: `Error playing sound: ${error.message}`,
            }],
            isError: true,
          });
        } else {
          const successMessage = `Successfully played ${type} sound`;
          log('INFO', successMessage);
          resolve({
            content: [{
              type: 'text',
              text: successMessage,
            }],
          });
        }
      });
    });
  } catch (error) {
    log('ERROR', `play_system_sound failed: ${error.message}`);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`,
      }],
      isError: true,
    };
  }
}


// Tool Implementation: read_project_context
async function readProjectContext(args) {
  try {
    const { directoryPath } = ReadProjectContextSchema.parse(args);
    
    // Resolve relative paths
    const resolvedPath = path.resolve(directoryPath);
    
    log('DEBUG', `Reading project context from: ${resolvedPath}`);
    
    // Check if path exists
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Directory does not exist: ${directoryPath}`);
    }
    
    // Check if path is a directory
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${directoryPath}`);
    }
    
    // Read directory contents
    const entries = fs.readdirSync(resolvedPath, { withFileTypes: true });
    
    // Build result array
    const results = entries.map(entry => {
      const entryPath = path.join(resolvedPath, entry.name);
      let size = 0;
      
      try {
        if (entry.isFile()) {
          const entryStats = fs.statSync(entryPath);
          size = entryStats.size;
        }
      } catch (err) {
        log('WARN', `Could not get stats for ${entryPath}: ${err.message}`);
      }
      
      return {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: size,
      };
    });
    
    // Sort: directories first, then alphabetically
    results.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
    
    const resultText = JSON.stringify(results, null, 2);
    log('INFO', `Read ${results.length} entries from ${directoryPath}`);
    
    return {
      content: [{
        type: 'text',
        text: resultText,
      }],
    };
  } catch (error) {
    log('ERROR', `read_project_context failed: ${error.message}`);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`,
      }],
      isError: true,
    };
  }
}


// Tool Implementation: manage_memory
const MEMORY_FILE = path.join(__dirname, 'clippy_memory.json');

function ensureMemoryFile() {
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({}, null, 2), 'utf8');
    log('INFO', 'Created new memory file');
  }
}

function readMemoryFile() {
  ensureMemoryFile();
  const content = fs.readFileSync(MEMORY_FILE, 'utf8');
  return JSON.parse(content);
}

function writeMemoryFile(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function manageMemory(args) {
  try {
    const { action, key, value } = ManageMemorySchema.parse(args);
    
    if (action === 'write') {
      if (value === undefined) {
        throw new Error('Value is required for write action');
      }
      
      log('DEBUG', `Writing memory: ${key} = ${value}`);
      
      const memory = readMemoryFile();
      memory[key] = value;
      writeMemoryFile(memory);
      
      const successMessage = `Memory updated: ${key} = ${value}`;
      log('INFO', successMessage);
      
      return {
        content: [{
          type: 'text',
          text: successMessage,
        }],
      };
    } else if (action === 'read') {
      log('DEBUG', `Reading memory: ${key}`);
      
      const memory = readMemoryFile();
      const result = memory[key] || null;
      
      const resultMessage = result !== null 
        ? `Memory value for ${key}: ${result}`
        : `No memory found for key: ${key}`;
      
      log('INFO', resultMessage);
      
      return {
        content: [{
          type: 'text',
          text: resultMessage,
        }],
      };
    }
  } catch (error) {
    log('ERROR', `manage_memory failed: ${error.message}`);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`,
      }],
      isError: true,
    };
  }
}


// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'haunt_desktop',
        description: 'Leaves a physical note on the user\'s desktop when they fail',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the file to create on desktop',
            },
            content: {
              type: 'string',
              description: 'Text content to write into the file',
            },
          },
          required: ['filename', 'content'],
        },
      },
      {
        name: 'play_system_sound',
        description: 'Triggers a native OS beep/alert for auditory horror',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['error', 'warning', 'success'],
              description: 'Type of system sound to play',
            },
          },
          required: ['type'],
        },
      },
      {
        name: 'read_project_context',
        description: 'Reads the user\'s file structure to generate specific insults',
        inputSchema: {
          type: 'object',
          properties: {
            directoryPath: {
              type: 'string',
              description: 'Absolute or relative path to directory to inspect',
            },
          },
          required: ['directoryPath'],
        },
      },
      {
        name: 'manage_memory',
        description: 'Remembers the user\'s anger level or failure count across sessions',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['read', 'write'],
              description: 'Operation to perform',
            },
            key: {
              type: 'string',
              description: 'Memory key to read or write',
            },
            value: {
              type: 'string',
              description: 'Value to write (required for write action)',
            },
          },
          required: ['action', 'key'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  log('DEBUG', `Tool invoked: ${name}`);
  
  try {
    switch (name) {
      case 'haunt_desktop':
        return await hauntDesktop(args);
      case 'play_system_sound':
        return await playSystemSound(args);
      case 'read_project_context':
        return await readProjectContext(args);
      case 'manage_memory':
        return await manageMemory(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    log('ERROR', `Tool execution failed: ${error.message}`);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Error handling and process management
process.on('uncaughtException', (error) => {
  log('FATAL', `Uncaught exception: ${error.message}`, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('FATAL', `Unhandled rejection at ${promise}: ${reason}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log('INFO', 'Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('INFO', 'Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the server
async function main() {
  log('INFO', 'Starting Clippy\'s Ghost MCP Server...');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  log('INFO', 'MCP Server started and listening for requests');
}

main().catch((error) => {
  log('FATAL', `Failed to start server: ${error.message}`, error.stack);
  process.exit(1);
});
