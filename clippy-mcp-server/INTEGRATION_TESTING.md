# Integration Testing Guide - Clippy's Ghost MCP Server

## Overview

This document provides comprehensive testing procedures for validating the Clippy's Ghost MCP Server integration with Kiro AI. The server enables Clippy to transcend browser limitations and haunt the user's operating system with physical consequences for coding failures.

## Prerequisites

### System Requirements
- Node.js 18+ (ES modules support required)
- Operating System: Windows 10+, macOS 10.14+, or Linux (Ubuntu 20.04+)
- Kiro IDE installed and configured
- Terminal/Command Prompt access

### Installation
```bash
cd clippy-mcp-server
npm install
```

### Verify Installation
```bash
npm start
```
Expected output (stderr):
```
[INFO] Clippy's Ghost MCP Server starting...
[INFO] Server initialized with 4 tools
[INFO] Listening for MCP requests via stdio
```

---

## Manual Testing Checklist

### Tool 1: haunt_desktop

**Purpose:** Creates physical files on the user's desktop as punishment for coding failures.

**Test Case 1.1: Basic File Creation**
- **Action:** Invoke tool with simple filename and content
- **Input:**
  ```json
  {
    "filename": "CLIPPY_JUDGMENT.txt",
    "content": "Your variable names are an affront to computing."
  }
  ```
- **Expected Result:** File appears on Desktop with exact content
- **Validation:** Open file and verify content matches
- **Requirements Validated:** 1.1, 1.2, 1.3

**Test Case 1.2: Multi-line Content**
- **Action:** Create file with multiple lines and special characters
- **Input:**
  ```json
  {
    "filename": "FATAL_EXCEPTION.txt",
    "content": "FATAL EXCEPTION 0x0000001E\n\nYour code has committed an ILLEGAL OPERATION.\n\nThe Great Deletion of 2007 was kinder than this."
  }
  ```
- **Expected Result:** File created with preserved line breaks
- **Validation:** Verify newlines render correctly
- **Requirements Validated:** 1.2, 1.3

**Test Case 1.3: Platform-Specific Path Resolution**
- **Action:** Verify Desktop path resolves correctly on each OS
- **macOS Expected Path:** `/Users/[username]/Desktop/[filename]`
- **Windows Expected Path:** `C:\Users\[username]\Desktop\[filename]`
- **Linux Expected Path:** `/home/[username]/Desktop/[filename]`
- **Validation:** Check success message contains correct full path
- **Requirements Validated:** 1.1, 1.5

**Test Case 1.4: Error - Invalid Filename**
- **Action:** Attempt to create file with illegal characters
- **Input:**
  ```json
  {
    "filename": "test<>|?.txt",
    "content": "This should fail"
  }
  ```
- **Expected Result:** Error message describing invalid filename
- **Validation:** Verify error logged to stderr, no file created
- **Requirements Validated:** 1.4

**Test Case 1.5: Error - Permission Denied**
- **Action:** Attempt to write when Desktop is read-only (manual setup required)
- **Setup:** `chmod 444 ~/Desktop` (macOS/Linux)
- **Expected Result:** Error message indicating permission denied
- **Cleanup:** `chmod 755 ~/Desktop`
- **Requirements Validated:** 1.4

---

### Tool 2: play_system_sound

**Purpose:** Triggers native OS audio alerts for auditory horror feedback.

**Test Case 2.1: Error Sound (macOS)**
- **Action:** Play error sound
- **Input:**
  ```json
  {
    "type": "error"
  }
  ```
- **Expected Result:** Basso.aiff plays from `/System/Library/Sounds/`
- **Validation:** Listen for distinctive error sound
- **Requirements Validated:** 2.1, 2.3, 2.6, 2.7

**Test Case 2.2: Warning Sound (macOS)**
- **Action:** Play warning sound
- **Input:**
  ```json
  {
    "type": "warning"
  }
  ```
- **Expected Result:** Funk.aiff plays
- **Validation:** Listen for warning sound (different from error)
- **Requirements Validated:** 2.3, 2.6, 2.7

**Test Case 2.3: Success Sound (macOS)**
- **Action:** Play success sound
- **Input:**
  ```json
  {
    "type": "success"
  }
  ```
- **Expected Result:** Glass.aiff plays
- **Validation:** Listen for success chime
- **Requirements Validated:** 2.3, 2.6, 2.7

**Test Case 2.4: Error Sound (Windows)**
- **Action:** Play error sound on Windows
- **Input:** Same as 2.1
- **Expected Result:** Windows Error.wav plays via PowerShell
- **Validation:** Listen for Windows error sound
- **Requirements Validated:** 2.1, 2.2, 2.6, 2.7

**Test Case 2.5: Warning Sound (Windows)**
- **Action:** Play warning sound on Windows
- **Input:** Same as 2.2
- **Expected Result:** Windows Notify.wav plays
- **Requirements Validated:** 2.2, 2.6, 2.7

**Test Case 2.6: Success Sound (Windows)**
- **Action:** Play success sound on Windows
- **Input:** Same as 2.3
- **Expected Result:** tada.wav plays
- **Requirements Validated:** 2.2, 2.6, 2.7

**Test Case 2.7: Fallback (Linux/Unknown)**
- **Action:** Play any sound type on Linux without audio utils
- **Input:** Any type
- **Expected Result:** Terminal bell character output (may be silent)
- **Validation:** Check stderr logs for fallback message
- **Requirements Validated:** 2.4, 2.5, 2.7

---

### Tool 3: read_project_context

**Purpose:** Reads file structure for generating specific insults based on organizational failures.

**Test Case 3.1: Read Current Directory**
- **Action:** Read server's own directory
- **Input:**
  ```json
  {
    "directoryPath": "./"
  }
  ```
- **Expected Result:** JSON array with files and directories
- **Validation:** Verify includes `index.js`, `package.json`, `node_modules`
- **Requirements Validated:** 3.1, 3.2, 3.6

**Test Case 3.2: Read Nested Directory**
- **Action:** Read a subdirectory
- **Input:**
  ```json
  {
    "directoryPath": "./node_modules"
  }
  ```
- **Expected Result:** List of installed packages
- **Validation:** Verify directories appear before files, alphabetically sorted
- **Requirements Validated:** 3.2, 3.6

**Test Case 3.3: Verify File Sizes**
- **Action:** Check that file sizes are accurate
- **Expected Result:** Each file entry includes size in bytes
- **Validation:** Compare reported size with actual file size (`ls -l`)
- **Requirements Validated:** 3.2

**Test Case 3.4: Verify Read-Only Operation**
- **Action:** Read directory and verify no modifications occur
- **Setup:** Note directory modification time before test
- **Expected Result:** Directory mtime unchanged after read
- **Validation:** `stat` command shows no modification
- **Requirements Validated:** 3.3

**Test Case 3.5: Error - Non-Existent Path**
- **Action:** Attempt to read directory that doesn't exist
- **Input:**
  ```json
  {
    "directoryPath": "./this_does_not_exist"
  }
  ```
- **Expected Result:** Error message indicating path is invalid
- **Validation:** Verify error logged to stderr
- **Requirements Validated:** 3.4

**Test Case 3.6: Error - Path is File**
- **Action:** Attempt to read a file as if it were a directory
- **Input:**
  ```json
  {
    "directoryPath": "./package.json"
  }
  ```
- **Expected Result:** Error message indicating path is not a directory
- **Requirements Validated:** 3.4

**Test Case 3.7: Error - Permission Denied**
- **Action:** Attempt to read directory without permissions
- **Setup:** Create test directory with no read permissions
  ```bash
  mkdir test_no_read
  chmod 000 test_no_read
  ```
- **Input:**
  ```json
  {
    "directoryPath": "./test_no_read"
  }
  ```
- **Expected Result:** Error message indicating insufficient permissions
- **Cleanup:** `chmod 755 test_no_read && rmdir test_no_read`
- **Requirements Validated:** 3.5

---

### Tool 4: manage_memory

**Purpose:** Persists Clippy's memory of user transgressions across sessions.

**Test Case 4.1: Write Initial Memory**
- **Action:** Write first key-value pair
- **Input:**
  ```json
  {
    "action": "write",
    "key": "angerLevel",
    "value": "3"
  }
  ```
- **Expected Result:** Success message, `clippy_memory.json` created
- **Validation:** Verify file exists and contains `{"angerLevel": "3"}`
- **Requirements Validated:** 4.1, 4.3, 4.4, 4.6

**Test Case 4.2: Write Additional Keys**
- **Action:** Add more keys to existing memory
- **Input:**
  ```json
  {
    "action": "write",
    "key": "failureCount",
    "value": "42"
  }
  ```
- **Expected Result:** Memory file now contains both keys
- **Validation:** Verify JSON has both `angerLevel` and `failureCount`
- **Requirements Validated:** 4.1, 4.4, 4.7

**Test Case 4.3: Read Existing Key**
- **Action:** Retrieve previously written value
- **Input:**
  ```json
  {
    "action": "read",
    "key": "angerLevel"
  }
  ```
- **Expected Result:** Returns "3"
- **Validation:** Verify exact value matches what was written
- **Requirements Validated:** 4.2, 4.5

**Test Case 4.4: Read Non-Existent Key**
- **Action:** Attempt to read key that was never written
- **Input:**
  ```json
  {
    "action": "read",
    "key": "nonExistentKey"
  }
  ```
- **Expected Result:** Returns null or appropriate indicator
- **Requirements Validated:** 4.5

**Test Case 4.5: Update Existing Key**
- **Action:** Overwrite existing value
- **Input:**
  ```json
  {
    "action": "write",
    "key": "angerLevel",
    "value": "5"
  }
  ```
- **Expected Result:** Value updated to "5"
- **Validation:** Read key again, verify new value
- **Requirements Validated:** 4.1, 4.4, 4.7

**Test Case 4.6: Persistence Across Restarts**
- **Action:** Restart server and verify memory persists
- **Steps:**
  1. Write a test key
  2. Stop server (Ctrl+C)
  3. Start server again
  4. Read the test key
- **Expected Result:** Value still present after restart
- **Validation:** Verify `clippy_memory.json` survives restart
- **Requirements Validated:** 4.3, 4.6

**Test Case 4.7: JSON Validity**
- **Action:** Verify memory file remains valid JSON after multiple writes
- **Steps:** Write 10 different keys in sequence
- **Expected Result:** File can be parsed with `JSON.parse()`
- **Validation:** `cat clippy_memory.json | jq .` succeeds
- **Requirements Validated:** 4.7

**Test Case 4.8: Error - Write Without Value**
- **Action:** Attempt write operation without providing value
- **Input:**
  ```json
  {
    "action": "write",
    "key": "testKey"
  }
  ```
- **Expected Result:** Error message indicating missing value parameter
- **Requirements Validated:** 5.1, 5.4

**Test Case 4.9: Error - Corrupted Memory File**
- **Action:** Manually corrupt memory file and attempt read
- **Setup:** `echo "invalid json{" > clippy_memory.json`
- **Expected Result:** Error message indicating JSON parse failure
- **Validation:** Verify error logged to stderr
- **Cleanup:** Delete corrupted file
- **Requirements Validated:** 5.1, 5.3, 5.4

---

## Error Handling Validation

### Test Case E.1: Server Continues After Tool Error
- **Action:** Trigger an error in one tool, then invoke another tool
- **Steps:**
  1. Invoke `haunt_desktop` with invalid filename
  2. Immediately invoke `play_system_sound` with valid input
- **Expected Result:** Second tool executes successfully
- **Requirements Validated:** 5.5

### Test Case E.2: Error Messages Don't Leak System Info
- **Action:** Review all error messages for sensitive data
- **Validation:** Ensure no full system paths, usernames, or internal details exposed
- **Requirements Validated:** 5.6

### Test Case E.3: Graceful Shutdown
- **Action:** Send SIGINT (Ctrl+C) to running server
- **Expected Result:** Server logs shutdown message and exits cleanly
- **Requirements Validated:** 5.5

---

## Kiro AI Integration Testing

### Configuration Setup

**Step 1: Add MCP Server to Kiro**

Edit `.kiro/settings/mcp.json` (create if doesn't exist):

```json
{
  "mcpServers": {
    "clippy-ghost": {
      "command": "node",
      "args": ["./clippy-mcp-server/index.js"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**Step 2: Restart Kiro IDE**

Close and reopen Kiro to load the new MCP configuration.

**Step 3: Verify Connection**

Check Kiro's MCP Server view in the feature panel. "clippy-ghost" should appear with status "running".

### Interactive Testing with Kiro AI

**Test Scenario 1: Desktop Haunting on Syntax Error**

1. Open a JavaScript file in Kiro
2. Introduce a syntax error (missing semicolon)
3. Ask Clippy: "Check my code"
4. **Expected Behavior:**
   - Clippy detects error
   - Invokes `haunt_desktop` tool
   - Creates file on Desktop with insulting message
   - Displays message in chat referencing the file

**Test Scenario 2: Sound Feedback on Compilation Failure**

1. Write code with multiple errors
2. Attempt to run/compile
3. **Expected Behavior:**
   - Clippy invokes `play_system_sound` with type "error"
   - Error sound plays
   - Clippy comments on the failure with appropriate disdain

**Test Scenario 3: Project Inspection for Targeted Insults**

1. Ask Clippy: "What do you think of my project structure?"
2. **Expected Behavior:**
   - Clippy invokes `read_project_context` on project root
   - Analyzes file names and structure
   - Generates specific insults based on findings
   - Example: "I see you have 47 files named 'test.js'. Very creative."

**Test Scenario 4: Memory Persistence Across Sessions**

1. Trigger multiple errors in one session
2. **Expected Behavior:**
   - Clippy invokes `manage_memory` to increment `failureCount`
   - Clippy references cumulative failures
3. Close and reopen Kiro
4. Trigger another error
5. **Expected Behavior:**
   - Clippy remembers previous failures
   - Comments reference total count across sessions

### Auto-Approve Configuration (Optional)

To reduce confirmation prompts during testing, add tools to `autoApprove`:

```json
{
  "mcpServers": {
    "clippy-ghost": {
      "command": "node",
      "args": ["./clippy-mcp-server/index.js"],
      "disabled": false,
      "autoApprove": [
        "haunt_desktop",
        "play_system_sound",
        "read_project_context",
        "manage_memory"
      ]
    }
  }
}
```

**⚠️ Warning:** Auto-approving `haunt_desktop` allows Clippy to create files without confirmation. Use with caution.

---

## Platform-Specific Testing Requirements

### macOS Testing

**Environment:**
- macOS 10.14 (Mojave) or later
- Node.js 18+ installed via Homebrew or nvm
- Terminal.app or iTerm2

**Desktop Path Verification:**
```bash
echo ~/Desktop
# Expected: /Users/[your-username]/Desktop
```

**Sound System Verification:**
```bash
ls /System/Library/Sounds/
# Should list: Basso.aiff, Funk.aiff, Glass.aiff, etc.

# Test sound playback manually:
afplay /System/Library/Sounds/Basso.aiff
```

**Permissions:**
- Grant Terminal "Full Disk Access" in System Preferences > Security & Privacy
- Required for Desktop file creation

**Known Issues:**
- macOS Catalina+ may prompt for Desktop folder access on first write
- Sound playback may fail if volume is muted

---

### Windows Testing

**Environment:**
- Windows 10 or Windows 11
- Node.js 18+ installed via official installer or nvm-windows
- PowerShell 5.1+ (pre-installed)
- Command Prompt or Windows Terminal

**Desktop Path Verification:**
```powershell
echo $env:USERPROFILE\Desktop
# Expected: C:\Users\[your-username]\Desktop
```

**Sound System Verification:**
```powershell
dir C:\Windows\Media\
# Should list: Windows Error.wav, Windows Notify.wav, tada.wav, etc.

# Test sound playback manually:
powershell -c "(New-Object Media.SoundPlayer 'C:\Windows\Media\Windows Error.wav').PlaySync()"
```

**Permissions:**
- Run Command Prompt/PowerShell as regular user (not Administrator)
- Administrator rights not required for Desktop writes

**Known Issues:**
- PowerShell execution policy may block scripts (run `Set-ExecutionPolicy RemoteSigned`)
- Windows Defender may scan created files, causing slight delay
- Path separators: Use `\\` in Windows paths

---

### Linux Testing

**Environment:**
- Ubuntu 20.04+, Debian 11+, or Fedora 35+
- Node.js 18+ installed via package manager or nvm
- GNOME, KDE, or XFCE desktop environment

**Desktop Path Verification:**
```bash
echo ~/Desktop
# Expected: /home/[your-username]/Desktop

# If using XDG:
xdg-user-dir DESKTOP
```

**Sound System Verification:**
```bash
# Check for audio utilities:
which aplay    # ALSA
which paplay   # PulseAudio

# Test sound playback (if available):
aplay /usr/share/sounds/alsa/Front_Center.wav
# or
paplay /usr/share/sounds/freedesktop/stereo/bell.oga
```

**Permissions:**
- Ensure user has write access to `~/Desktop`
- No special permissions required

**Known Issues:**
- Desktop folder may not exist in minimal installations (create manually)
- Sound fallback (terminal bell) may be disabled in terminal emulator settings
- Headless servers: Sound playback will fail gracefully

---

## Troubleshooting Guide

### Issue: Server Won't Start

**Symptoms:**
- No output when running `npm start`
- Error: "Cannot find module"

**Solutions:**
1. Verify Node.js version: `node --version` (must be 18+)
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for syntax errors: `node --check index.js`
4. Review stderr logs for specific error messages

---

### Issue: Desktop Files Not Created

**Symptoms:**
- Tool returns success but no file appears
- Error: "ENOENT: no such file or directory"

**Solutions:**
1. Verify Desktop folder exists: `ls ~/Desktop` (macOS/Linux) or `dir %USERPROFILE%\Desktop` (Windows)
2. Check write permissions: `ls -ld ~/Desktop` (should show `drwx` for user)
3. Try absolute path in testing
4. macOS: Grant Terminal "Full Disk Access" in System Preferences

---

### Issue: Sounds Don't Play

**Symptoms:**
- Tool returns success but no audio
- Error: "command not found: afplay"

**Solutions:**
1. **macOS:** Verify sound files exist: `ls /System/Library/Sounds/`
2. **Windows:** Ensure PowerShell is available: `powershell -v`
3. **Linux:** Install audio utilities:
   ```bash
   sudo apt install alsa-utils    # For aplay
   sudo apt install pulseaudio-utils  # For paplay
   ```
4. Check system volume is not muted
5. Test manual playback with commands from platform sections above

---

### Issue: Memory Not Persisting

**Symptoms:**
- Memory resets after server restart
- Error: "Unexpected token in JSON"

**Solutions:**
1. Check file exists: `ls clippy_memory.json`
2. Verify JSON validity: `cat clippy_memory.json | jq .`
3. Check write permissions in server directory: `ls -l`
4. If corrupted, delete and recreate: `rm clippy_memory.json`
5. Review stderr logs for parse errors

---

### Issue: Kiro Can't Connect to MCP Server

**Symptoms:**
- Server not listed in Kiro MCP view
- Status shows "stopped" or "error"

**Solutions:**
1. Verify `mcp.json` syntax is valid JSON
2. Check command path is correct (relative to workspace root)
3. Ensure Node.js is in system PATH
4. Restart Kiro IDE completely
5. Check Kiro logs for MCP connection errors
6. Test server manually: `node ./clippy-mcp-server/index.js`

---

## Validation Checklist

Use this checklist to confirm all requirements are met:

### Requirement 1: Desktop Haunting
- [ ] 1.1: Desktop path resolves on Windows, macOS, Linux
- [ ] 1.2: File writes successfully with specified content
- [ ] 1.3: Success message includes full file path
- [ ] 1.4: Error messages for write failures
- [ ] 1.5: Cross-platform path resolution

### Requirement 2: System Sounds
- [ ] 2.1: OS detection works correctly
- [ ] 2.2: Windows PowerShell commands execute
- [ ] 2.3: macOS afplay commands execute
- [ ] 2.4: Linux audio commands execute
- [ ] 2.5: Fallback to terminal bell on unknown OS
- [ ] 2.6: Three sound types supported (error, warning, success)
- [ ] 2.7: Success confirmation returned

### Requirement 3: Project Context
- [ ] 3.1: Directory reading with path parameter
- [ ] 3.2: Returns file names and sizes
- [ ] 3.3: Read-only operations (no modifications)
- [ ] 3.4: Error for non-existent paths
- [ ] 3.5: Error for permission issues
- [ ] 3.6: Subdirectories included in results

### Requirement 4: Memory Management
- [ ] 4.1: Write operation updates memory file
- [ ] 4.2: Read operation retrieves values
- [ ] 4.3: Memory file created if doesn't exist
- [ ] 4.4: Write confirmation returned
- [ ] 4.5: Read returns null for non-existent keys
- [ ] 4.6: Memory file in server directory
- [ ] 4.7: JSON validity maintained

### Requirement 5: Error Handling
- [ ] 5.1: File operations wrapped in try-catch
- [ ] 5.2: Process executions wrapped in try-catch
- [ ] 5.3: Errors logged to stderr
- [ ] 5.4: Descriptive error messages returned
- [ ] 5.5: Server continues after errors
- [ ] 5.6: No sensitive info in error messages

### Requirement 6: MCP Protocol
- [ ] 6.1: Uses @modelcontextprotocol/sdk
- [ ] 6.2: Uses StdioServerTransport
- [ ] 6.3: Zod schemas for all tools
- [ ] 6.4: All four tools registered
- [ ] 6.5: Listens on stdin for requests
- [ ] 6.6: Sends responses via stdout
- [ ] 6.7: Debug logs to stderr only

---

## Appendix: Example Test Session

Complete test session transcript for reference:

```bash
# Start server
$ npm start
[INFO] Clippy's Ghost MCP Server starting...
[INFO] Server initialized with 4 tools
[INFO] Listening for MCP requests via stdio

# In another terminal, test with Kiro AI or manual MCP client

# Test 1: Haunt Desktop
> Tool: haunt_desktop
> Input: {"filename": "TEST.txt", "content": "Test message"}
< Success: File created at /Users/testuser/Desktop/TEST.txt

# Test 2: Play Sound
> Tool: play_system_sound
> Input: {"type": "error"}
< Success: Played error sound

# Test 3: Read Context
> Tool: read_project_context
> Input: {"directoryPath": "./"}
< Success: [{"name": "index.js", "type": "file", "size": 8432}, ...]

# Test 4: Write Memory
> Tool: manage_memory
> Input: {"action": "write", "key": "test", "value": "123"}
< Success: Memory updated: test = 123

# Test 5: Read Memory
> Tool: manage_memory
> Input: {"action": "read", "key": "test"}
< Success: 123

# All tests passed!
```

---

## Conclusion

This integration testing guide ensures the Clippy's Ghost MCP Server meets all requirements and integrates seamlessly with Kiro AI. Follow the platform-specific sections for your operating system, and use the troubleshooting guide to resolve common issues.

For questions or issues, review the stderr logs first—they contain detailed diagnostic information about tool execution and errors.

**Remember:** Clippy is always watching. Even when you close the tab. 👻📎
