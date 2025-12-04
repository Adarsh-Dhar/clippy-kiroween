#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logging utility - writes only to stderr
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${level}] ${message}`, ...args);
}

// Helper to read/write game state
const GAME_STATE_PATH = path.join(__dirname, '../.kiro/.hook-state.json');
const HOOKS_CONFIG_PATH = path.join(__dirname, '../.kiro/hooks/hooks.json');
const MEMORY_FILE = path.join(__dirname, '../.kiro/.clippy-memory.json');

function readGameState() {
  try {
    if (fs.existsSync(GAME_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(GAME_STATE_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading game state:', err.message);
  }
  return { angerLevel: 0, errorCount: 0, lastEvent: null, timestamp: Date.now() };
}

function writeGameState(state) {
  try {
    const dir = path.dirname(GAME_STATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(GAME_STATE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Error writing game state:', err.message);
  }
}

function readHooksConfig() {
  try {
    if (fs.existsSync(HOOKS_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(HOOKS_CONFIG_PATH, 'utf-8'));
    }
  } catch (err) {
    log('ERROR', `Error reading hooks config: ${err.message}`);
  }
  return { hooks: [] };
}

// Memory management functions
function ensureMemoryFile() {
  if (!fs.existsSync(MEMORY_FILE)) {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({}, null, 2), 'utf8');
    log('INFO', 'Created new memory file');
  }
}

function readMemoryFile() {
  ensureMemoryFile();
  try {
    const content = fs.readFileSync(MEMORY_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    log('ERROR', `Error reading memory file: ${err.message}`);
    return {};
  }
}

function writeMemoryFile(data) {
  ensureMemoryFile();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Desktop path helper
function getDesktopPath() {
  const homeDir = os.homedir();
  return path.join(homeDir, 'Desktop');
}

// Sound command helper with cross-platform support
function getSoundCommand(soundType, soundParam) {
  const platform = os.platform();
  
  // Map both parameter types to sound files
  let mappedType = soundType || soundParam;
  
  // Map 'beep' to 'success', 'tada' to 'success' for compatibility
  if (mappedType === 'beep' || mappedType === 'tada') {
    mappedType = 'success';
  }
  
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
    const soundPath = soundMappings.win32[mappedType] || soundMappings.win32.error;
    return `powershell -c "(New-Object Media.SoundPlayer '${soundPath}').PlaySync()"`;
  } else if (platform === 'darwin') {
    const soundPath = soundMappings.darwin[mappedType] || soundMappings.darwin.error;
    return `afplay "${soundPath}"`;
  } else {
    // Linux or unknown - use terminal bell
    return 'echo -e "\\a"';
  }
}

// Initialize the Server
const server = new Server(
  {
    name: "clippy-purgatory-mcp",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Original haunting tools
      {
        name: "haunt_desktop",
        description: "Creates a spooky file on the user's actual desktop with Clippy's message.",
        inputSchema: {
          type: "object",
          properties: {
            filename: { type: "string", description: "Name of the file (e.g., YOU_FAILED.txt)" },
            message: { type: "string", description: "The spooky message to write inside (alias for content)." },
            content: { type: "string", description: "Text content to write into the file (alias for message)." },
          },
          required: ["filename"],
        },
      },
      {
        name: "play_system_sound",
        description: "Plays a system beep or sound effect on the host machine. Supports Windows, macOS, and Linux.",
        inputSchema: {
          type: "object",
          properties: {
            sound: { type: "string", enum: ["beep", "error", "tada"], description: "The type of sound to play (beep/tada maps to success)." },
            type: { type: "string", enum: ["error", "warning", "success"], description: "Type of system sound to play (error/warning/success)." },
          },
        },
      },
      {
        name: "read_project_context",
        description: "Reads the user's file structure to generate specific insults or analyze project structure.",
        inputSchema: {
          type: "object",
          properties: {
            directoryPath: { type: "string", description: "Absolute or relative path to directory to inspect" },
          },
          required: ["directoryPath"],
        },
      },
      {
        name: "manage_memory",
        description: "Remembers the user's anger level or failure count across sessions. Stores data in .kiro/.clippy-memory.json",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["read", "write"], description: "Operation to perform" },
            key: { type: "string", description: "Memory key to read or write" },
            value: { type: "string", description: "Value to write (required for write action)" },
          },
          required: ["action", "key"],
        },
      },
      
      // Game state management
      {
        name: "get_clippy_state",
        description: "Get Clippy's current anger level, error count, and mood from the game state.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "set_clippy_anger",
        description: "Set Clippy's anger level (0-5). Use this to punish or reward the developer.",
        inputSchema: {
          type: "object",
          properties: {
            level: { type: "number", description: "Anger level from 0 (calm) to 5 (FATAL)", minimum: 0, maximum: 5 },
            reason: { type: "string", description: "Why the anger level changed" },
          },
          required: ["level"],
        },
      },
      {
        name: "increment_anger",
        description: "Increment Clippy's anger level by a specified amount.",
        inputSchema: {
          type: "object",
          properties: {
            amount: { type: "number", description: "Amount to increase anger (default: 1)", minimum: 1, maximum: 5 },
            eventType: { type: "string", description: "Type of event causing anger" },
          },
          required: ["eventType"],
        },
      },
      {
        name: "reset_game_state",
        description: "Reset Clippy's anger level and error count to 0. Use sparingly.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      
      // Hook management
      {
        name: "list_hooks",
        description: "List all configured Clippy hooks and their status (enabled/disabled).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "toggle_hook",
        description: "Enable or disable a specific Clippy hook by name.",
        inputSchema: {
          type: "object",
          properties: {
            hookName: { type: "string", description: "Name of the hook to toggle" },
            enabled: { type: "boolean", description: "Whether to enable (true) or disable (false) the hook" },
          },
          required: ["hookName", "enabled"],
        },
      },
      {
        name: "run_hook",
        description: "Manually execute a specific hook script.",
        inputSchema: {
          type: "object",
          properties: {
            hookName: { type: "string", description: "Name of the hook to run" },
            args: { type: "array", items: { type: "string" }, description: "Optional arguments to pass to the hook" },
          },
          required: ["hookName"],
        },
      },
      
      // Code analysis
      {
        name: "analyze_code_quality",
        description: "Run code quality checks (complexity, tests, dependencies) and return results.",
        inputSchema: {
          type: "object",
          properties: {
            checks: { 
              type: "array", 
              items: { type: "string", enum: ["complexity", "tests", "dependencies", "todos"] },
              description: "Which checks to run"
            },
          },
          required: ["checks"],
        },
      },
      
      // Punishment actions
      {
        name: "trigger_punishment",
        description: "Trigger a specific punishment based on Clippy's anger level.",
        inputSchema: {
          type: "object",
          properties: {
            type: { 
              type: "string", 
              enum: ["bsod", "apology", "jail", "void", "glitch"],
              description: "Type of punishment to trigger"
            },
            message: { type: "string", description: "Custom message for the punishment" },
          },
          required: ["type"],
        },
      },
    ],
  };
});

// Handle Tool Execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    log('DEBUG', `Tool invoked: ${name}`);
    
    // Original haunting tools
    if (name === "haunt_desktop") {
      try {
        // Support both 'content' and 'message' parameters for backward compatibility
        const fileContent = args.content || args.message;
        if (!fileContent) {
          throw new Error('Either "content" or "message" parameter is required');
        }
        
        const desktopPath = getDesktopPath();
        const filePath = path.join(desktopPath, args.filename);
        
        log('DEBUG', `Haunting desktop with file: ${filePath}`);
        
        fs.writeFileSync(filePath, fileContent, 'utf8');
        
        // Increment anger for haunting
        const state = readGameState();
        state.angerLevel = Math.min(state.angerLevel + 1, 5);
        state.lastEvent = { type: 'desktop_haunted', timestamp: Date.now() };
        writeGameState(state);
        
        const successMessage = `File created at ${filePath}`;
        log('INFO', successMessage);
        
        return {
          content: [{ type: "text", text: `👻 ${successMessage}\n📊 Clippy's anger increased to ${state.angerLevel}/5` }],
        };
      } catch (error) {
        log('ERROR', `haunt_desktop failed: ${error.message}`);
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }

    if (name === "play_system_sound") {
      try {
        // Support both 'type' and 'sound' parameters
        const soundType = args.type || args.sound;
        if (!soundType) {
          throw new Error('Either "type" or "sound" parameter is required');
        }
        
        const command = getSoundCommand(args.type, args.sound);
        log('DEBUG', `Playing ${soundType} sound with command: ${command}`);
        
        // Terminal bell as fallback
        console.log('\u0007');
        
        // Use execAsync for better error handling
        try {
          await execAsync(command, { timeout: 5000 });
          const successMessage = `Successfully played ${soundType} sound`;
          log('INFO', successMessage);
          return {
            content: [{ type: "text", text: `🔊 ${successMessage}` }],
          };
        } catch (execError) {
          log('WARN', `Sound playback failed: ${execError.message}, using terminal bell fallback`);
          return {
            content: [{ type: "text", text: `🔊 Played sound (fallback): ${soundType}` }],
          };
        }
      } catch (error) {
        log('ERROR', `play_system_sound failed: ${error.message}`);
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }

    if (name === "read_project_context") {
      try {
        const { directoryPath } = args;
        if (!directoryPath) {
          throw new Error('directoryPath parameter is required');
        }
        
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

    if (name === "manage_memory") {
      try {
        const { action, key, value } = args;
        
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
        } else {
          throw new Error(`Invalid action: ${action}. Must be 'read' or 'write'`);
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

    // Game state management
    if (name === "get_clippy_state") {
      const state = readGameState();
      const moods = ['😊 Calm', '😐 Annoyed', '😠 Angry', '🤬 Furious', '👻 Haunted', '💀 FATAL'];
      const mood = moods[state.angerLevel] || moods[0];
      
      return {
        content: [{
          type: "text",
          text: `📊 Clippy's Current State:\n\nAnger Level: ${state.angerLevel}/5\nMood: ${mood}\nError Count: ${state.errorCount}\nLast Event: ${state.lastEvent?.type || 'None'}\nTimestamp: ${state.lastEvent?.timestamp ? new Date(state.lastEvent.timestamp).toLocaleString() : 'N/A'}`
        }],
      };
    }

    if (name === "set_clippy_anger") {
      const state = readGameState();
      state.angerLevel = Math.max(0, Math.min(5, args.level));
      state.lastEvent = {
        type: 'anger_set',
        reason: args.reason || 'Manual adjustment',
        timestamp: Date.now(),
      };
      writeGameState(state);
      
      const moods = ['😊 Calm', '😐 Annoyed', '😠 Angry', '🤬 Furious', '👻 Haunted', '💀 FATAL'];
      return {
        content: [{
          type: "text",
          text: `✅ Clippy's anger set to ${state.angerLevel}/5\nMood: ${moods[state.angerLevel]}\nReason: ${args.reason || 'Manual adjustment'}`
        }],
      };
    }

    if (name === "increment_anger") {
      const state = readGameState();
      const amount = args.amount || 1;
      state.angerLevel = Math.min(state.angerLevel + amount, 5);
      state.errorCount += 1;
      state.lastEvent = {
        type: args.eventType,
        timestamp: Date.now(),
      };
      writeGameState(state);
      
      return {
        content: [{
          type: "text",
          text: `📈 Clippy's anger increased by ${amount}\nNew level: ${state.angerLevel}/5\nEvent: ${args.eventType}`
        }],
      };
    }

    if (name === "reset_game_state") {
      const state = {
        angerLevel: 0,
        errorCount: 0,
        lastEvent: { type: 'reset', timestamp: Date.now() },
        timestamp: Date.now(),
      };
      writeGameState(state);
      
      return {
        content: [{
          type: "text",
          text: `🔄 Game state reset\n📎 Clippy says: "Fresh start. Don't waste it."`
        }],
      };
    }

    // Hook management
    if (name === "list_hooks") {
      const config = readHooksConfig();
      const hookList = config.hooks.map((hook, i) => {
        const status = hook.enabled ? '✅' : '❌';
        return `${i + 1}. ${status} ${hook.name}\n   Event: ${hook.event}\n   Description: ${hook.description}`;
      }).join('\n\n');
      
      const enabled = config.hooks.filter(h => h.enabled).length;
      return {
        content: [{
          type: "text",
          text: `🪝 Configured Hooks (${enabled}/${config.hooks.length} enabled):\n\n${hookList}`
        }],
      };
    }

    if (name === "toggle_hook") {
      const config = readHooksConfig();
      const hook = config.hooks.find(h => h.name === args.hookName);
      
      if (!hook) {
        return {
          content: [{ type: "text", text: `❌ Hook not found: "${args.hookName}"` }],
          isError: true,
        };
      }
      
      hook.enabled = args.enabled;
      fs.writeFileSync(HOOKS_CONFIG_PATH, JSON.stringify(config, null, 2));
      
      const action = args.enabled ? 'enabled' : 'disabled';
      return {
        content: [{
          type: "text",
          text: `✅ Hook "${args.hookName}" ${action} successfully`
        }],
      };
    }

    if (name === "run_hook") {
      const config = readHooksConfig();
      const hook = config.hooks.find(h => h.name === args.hookName);
      
      if (!hook) {
        return {
          content: [{ type: "text", text: `❌ Hook not found: "${args.hookName}"` }],
          isError: true,
        };
      }
      
      const hookArgs = args.args || [];
      const command = `${hook.command} ${hookArgs.join(' ')}`;
      
      try {
        const { stdout, stderr } = await execAsync(command, { cwd: path.join(__dirname, '..') });
        return {
          content: [{
            type: "text",
            text: `✅ Hook "${args.hookName}" executed\n\nOutput:\n${stdout}\n${stderr ? `Errors:\n${stderr}` : ''}`
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: "text",
            text: `❌ Hook execution failed: ${err.message}\n\nOutput:\n${err.stdout || ''}\n${err.stderr || ''}`
          }],
          isError: true,
        };
      }
    }

    // Code analysis
    if (name === "analyze_code_quality") {
      const results = [];
      
      for (const check of args.checks) {
        try {
          let output;
          switch (check) {
            case 'complexity':
              output = await execAsync('node .kiro/hooks/complexity-check.js', { cwd: path.join(__dirname, '..') });
              results.push(`📊 Complexity Check:\n${output.stdout}`);
              break;
            case 'tests':
              output = await execAsync('node .kiro/hooks/run-tests.js', { cwd: path.join(__dirname, '..') });
              results.push(`🧪 Test Results:\n${output.stdout}`);
              break;
            case 'dependencies':
              output = await execAsync('node .kiro/hooks/audit-deps.js', { cwd: path.join(__dirname, '..') });
              results.push(`📦 Dependency Audit:\n${output.stdout}`);
              break;
            case 'todos':
              output = await execAsync('grep -r "TODO" src || true', { cwd: path.join(__dirname, '..') });
              const todoCount = output.stdout.split('\n').filter(l => l.trim()).length;
              results.push(`📝 TODO Comments: ${todoCount} found\n${output.stdout.substring(0, 500)}`);
              break;
          }
        } catch (err) {
          results.push(`❌ ${check} check failed: ${err.message}`);
        }
      }
      
      return {
        content: [{
          type: "text",
          text: `🔍 Code Quality Analysis:\n\n${results.join('\n\n')}`
        }],
      };
    }

    // Punishment actions
    if (name === "trigger_punishment") {
      const state = readGameState();
      state.lastEvent = {
        type: `punishment_${args.type}`,
        message: args.message,
        timestamp: Date.now(),
      };
      writeGameState(state);
      
      // Create a punishment marker file that the frontend can detect
      const punishmentPath = path.join(__dirname, '../.kiro/.punishment.json');
      fs.writeFileSync(punishmentPath, JSON.stringify({
        type: args.type,
        message: args.message || `Clippy has triggered ${args.type}`,
        timestamp: Date.now(),
        angerLevel: state.angerLevel,
      }, null, 2));
      
      return {
        content: [{
          type: "text",
          text: `💀 Punishment triggered: ${args.type}\n${args.message || ''}\n\n📎 Clippy says: "You brought this upon yourself."`
        }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
    
  } catch (err) {
    return {
      content: [{ type: "text", text: `❌ Error: ${err.message}` }],
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
  log('INFO', 'Starting Clippy Purgatory MCP Server...');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  log('INFO', 'MCP Server started and listening for requests');
  log('INFO', 'Watching your every move...');
}

main().catch((error) => {
  log('FATAL', `Failed to start server: ${error.message}`, error.stack);
  process.exit(1);
});