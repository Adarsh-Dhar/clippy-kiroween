# Design Document: Retro File System Features

## Overview

This design implements authentic Windows 95-era file system dialogs and interactions for the haunted IDE. The system extends the existing FileSystemContext with new dialog components that maintain period-accurate styling while integrating with the anger state machine and Clippy's vengeful personality.

## Architecture

### Component Hierarchy

```
App
├── FileSystemProvider (existing)
│   └── Enhanced with disk space tracking
├── GameProvider (existing)
│   └── Receives file operation events
└── New Dialog Components
    ├── SaveAsDialog
    ├── OpenFileDialog
    ├── FileAssociationDialog
    ├── FilePropertiesDialog
    ├── DiskSpaceWarning
    └── FileErrorDialog
```

### Data Flow

1. User triggers file operation → FileSystemContext
2. FileSystemContext validates operation → Shows appropriate dialog
3. Dialog user interaction → FileSystemContext updates state
4. On error/warning → GameContext receives event → Anger level updates
5. GameContext event → Clippy reacts with contextual message

## Components and Interfaces

### 1. Enhanced FileSystemContext

**New State:**
```typescript
interface FileSystemContextType {
  // ... existing properties
  diskSpaceUsed: number;
  diskSpaceLimit: number;
  fileAssociations: Map<string, string>;
  showSaveAsDialog: boolean;
  showOpenDialog: boolean;
  showFileAssociationDialog: boolean;
  showPropertiesDialog: boolean;
  showDiskWarning: boolean;
  showErrorDialog: boolean;
  errorDialogMessage: string;
  errorDialogCode: string;
}
```

**New Methods:**
```typescript
interface FileSystemContextType {
  // ... existing methods
  calculateDiskSpace: () => number;
  checkDiskSpace: (fileSize: number) => boolean;
  setFileAssociation: (extension: string, handler: string) => void;
  getFileAssociation: (extension: string) => string | null;
  triggerSaveAsDialog: () => void;
  triggerOpenDialog: () => void;
  triggerFileError: (message: string, code: string) => void;
  getFileProperties: (path: string) => FileProperties | null;
}
```

**FileProperties Interface:**
```typescript
interface FileProperties {
  name: string;
  type: string;
  location: string;
  size: number;
  sizeFormatted: string;
  created: Date;
  modified: Date;
  accessed: Date;
}
```

### 2. SaveAsDialog Component

**Purpose:** Windows 95-styled "Save As" dialog with directory navigation

**Props:**
```typescript
interface SaveAsDialogProps {
  isOpen: boolean;
  currentFileName: string;
  currentContent: string;
  onSave: (path: string, fileName: string) => void;
  onCancel: () => void;
}
```

**Features:**
- Directory tree navigation (reuses FileTree component logic)
- File name input field
- File type dropdown (*.txt, *.js, *.py, *.c, *.cpp, *.java, All Files)
- Save/Cancel buttons with Win95 styling
- Validation for invalid file names
- Triggers error dialog on validation failure

**Layout:**
```
┌─────────────────────────────────────┐
│ Save As                          [X]│
├─────────────────────────────────────┤
│ Save in: [/src          ▼]          │
│ ┌─────────────────────────────────┐ │
│ │ 📁 src                          │ │
│ │ 📁 public                       │ │
│ │ 📄 README.md                    │ │
│ └─────────────────────────────────┘ │
│ File name: [newfile.txt          ] │
│ Save as type: [Text Files (*.txt)▼]│
│                    [Save] [Cancel]  │
└─────────────────────────────────────┘
```

### 3. OpenFileDialog Component

**Purpose:** Windows 95-styled "Open" dialog with file browsing

**Props:**
```typescript
interface OpenFileDialogProps {
  isOpen: boolean;
  onOpen: (path: string) => void;
  onCancel: () => void;
}
```

**Features:**
- Directory tree navigation
- File list with icons and details
- File type filter dropdown
- Open/Cancel buttons
- Double-click to open
- Shows file size and modified date

**Layout:**
```
┌─────────────────────────────────────┐
│ Open                             [X]│
├─────────────────────────────────────┤
│ Look in: [/src          ▼]          │
│ ┌─────────────────────────────────┐ │
│ │ Name        Size    Modified    │ │
│ │ 📄 main.js  1.2KB   12/04/2025  │ │
│ │ 📄 app.js   3.4KB   12/03/2025  │ │
│ └─────────────────────────────────┘ │
│ File name: [                      ] │
│ Files of type: [All Files (*.*)  ▼]│
│                    [Open] [Cancel]  │
└─────────────────────────────────────┘
```

### 4. FileAssociationDialog Component

**Purpose:** Dialog for handling unknown file types

**Props:**
```typescript
interface FileAssociationDialogProps {
  isOpen: boolean;
  fileName: string;
  extension: string;
  onSelectAssociation: (handler: string, remember: boolean) => void;
  onCancel: () => void;
}
```

**Features:**
- List of available "applications" (text editor, code viewer)
- "Always use this program" checkbox
- OK/Cancel buttons
- Windows 95 warning icon

**Layout:**
```
┌─────────────────────────────────────┐
│ Open With                        [X]│
├─────────────────────────────────────┤
│ ⚠️  Windows cannot open this file:  │
│                                     │
│     file.xyz                        │
│                                     │
│ Choose the program you want to use: │
│ ┌─────────────────────────────────┐ │
│ │ ○ Text Editor                   │ │
│ │ ○ Code Viewer                   │ │
│ │ ○ View as Text                  │ │
│ └─────────────────────────────────┘ │
│ ☐ Always use this program to open  │
│   this file type                    │
│                        [OK] [Cancel]│
└─────────────────────────────────────┘
```

### 5. FilePropertiesDialog Component

**Purpose:** Display file metadata in tabbed dialog

**Props:**
```typescript
interface FilePropertiesDialogProps {
  isOpen: boolean;
  filePath: string;
  onClose: () => void;
}
```

**Features:**
- Tabbed interface (General tab)
- File icon display
- Read-only property fields
- OK/Cancel/Apply buttons
- Windows 95 tab styling

**Layout:**
```
┌─────────────────────────────────────┐
│ file.txt Properties              [X]│
├─────────────────────────────────────┤
│ [General]                           │
│                                     │
│ 📄 file.txt                         │
│                                     │
│ Type:        Text Document          │
│ Location:    /src                   │
│ Size:        1,234 bytes (1.2 KB)   │
│                                     │
│ Created:     December 4, 2025       │
│ Modified:    December 4, 2025       │
│ Accessed:    December 4, 2025       │
│                                     │
│           [OK] [Cancel] [Apply]     │
└─────────────────────────────────────┘
```

### 6. DiskSpaceWarning Component

**Purpose:** Low disk space warning dialog

**Props:**
```typescript
interface DiskSpaceWarningProps {
  isOpen: boolean;
  spaceUsed: number;
  spaceLimit: number;
  onClose: () => void;
}
```

**Features:**
- Yellow warning icon
- Disk space usage display
- Clippy integration for mocking message
- OK button only
- Triggers anger level increase

**Layout:**
```
┌─────────────────────────────────────┐
│ Low Disk Space                   [X]│
├─────────────────────────────────────┤
│ ⚠️  You are running out of disk     │
│     space on drive C:.              │
│                                     │
│     Used: 8.2 MB of 10 MB (82%)     │
│                                     │
│     To free space, delete files you │
│     no longer need.                 │
│                                     │
│                              [OK]   │
└─────────────────────────────────────┘
```

### 7. FileErrorDialog Component

**Purpose:** Display file operation errors with error codes

**Props:**
```typescript
interface FileErrorDialogProps {
  isOpen: boolean;
  errorMessage: string;
  errorCode: string;
  clippyMessage?: string;
  onClose: () => void;
}
```

**Features:**
- Red X error icon
- Error message display
- Hexadecimal error code
- Optional Clippy sarcastic message
- OK button only
- Triggers anger level increase

**Layout:**
```
┌─────────────────────────────────────┐
│ Error                            [X]│
├─────────────────────────────────────┤
│ ❌  Cannot save file.                │
│                                     │
│     The filename, directory name,   │
│     or volume label syntax is       │
│     incorrect.                      │
│                                     │
│     Error 0x8007007B                │
│                                     │
│     [Clippy says: "Nice try."]      │
│                                     │
│                              [OK]   │
└─────────────────────────────────────┘
```

## Data Models

### Disk Space Tracking

```typescript
interface DiskSpaceState {
  used: number;        // bytes
  limit: number;       // bytes (default: 10MB)
  warningThreshold: number;  // 0.8 (80%)
  criticalThreshold: number; // 1.0 (100%)
}
```

**Calculation Logic:**
- Recursively sum all file content lengths
- Update on every file create/update/delete operation
- Check thresholds after each operation
- Emit events to GameContext when thresholds crossed

### File Associations

```typescript
interface FileAssociationMap {
  [extension: string]: string;  // extension -> handler
}

// Default associations
const defaultAssociations = {
  '.txt': 'text-editor',
  '.js': 'code-editor',
  '.py': 'code-editor',
  '.c': 'code-editor',
  '.cpp': 'code-editor',
  '.java': 'code-editor',
  '.md': 'text-editor',
};
```

**Storage:**
- Stored in FileSystemContext state
- Persisted to localStorage
- User can override defaults via File Association Dialog

### Error Codes

```typescript
const FILE_ERROR_CODES = {
  INVALID_NAME: '0x8007007B',
  FILE_NOT_FOUND: '0x80070002',
  ACCESS_DENIED: '0x80070005',
  DISK_FULL: '0x80070070',
  FILE_EXISTS: '0x80070050',
  PATH_TOO_LONG: '0x800700CE',
};
```

## Error Handling

### Validation Rules

**File Name Validation:**
- Cannot contain: `< > : " / \ | ? *`
- Cannot be empty or only whitespace
- Cannot exceed 255 characters
- Cannot be reserved names: `CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`

**Path Validation:**
- Total path length cannot exceed 260 characters
- Each directory name follows file name rules

**Disk Space Validation:**
- Check available space before save operations
- Prevent save if space would exceed limit
- Show warning at 80% usage
- Show error at 100% usage

### Error Flow

1. **Validation Error:**
   ```
   User Action → Validation → Error Dialog → Anger +1
   ```

2. **Disk Space Error:**
   ```
   Save Attempt → Space Check → Error Dialog → Anger +2
   ```

3. **Multiple Errors:**
   ```
   3+ Errors in 30s → Anger +3 → Clippy Escalation
   ```

### Integration with GameContext

```typescript
// In FileSystemContext
const handleFileError = (errorType: string, errorCode: string) => {
  // Show error dialog
  setErrorDialogMessage(getErrorMessage(errorType));
  setErrorDialogCode(errorCode);
  setShowErrorDialog(true);
  
  // Trigger anger increase
  const { setAngerLevel, angerLevel } = useGame();
  setAngerLevel(angerLevel + 1);
  
  // Emit event for Clippy
  window.dispatchEvent(new CustomEvent('file-error', {
    detail: { errorType, errorCode, timestamp: Date.now() }
  }));
};
```

## Testing Strategy

### Unit Tests

**FileSystemContext Tests:**
- `calculateDiskSpace()` correctly sums file sizes
- `checkDiskSpace()` validates against limit
- File name validation catches invalid characters
- Error codes are correctly assigned
- File associations are stored and retrieved

**Dialog Component Tests:**
- SaveAsDialog renders with correct styling
- OpenFileDialog displays file list
- FileAssociationDialog handles user selection
- FilePropertiesDialog displays correct metadata
- DiskSpaceWarning shows correct usage percentage
- FileErrorDialog displays error code and message

### Integration Tests

**File Operation Flows:**
- Save As flow: open dialog → select location → enter name → save
- Open flow: open dialog → browse files → select → open
- Error flow: invalid operation → error dialog → anger increase
- Disk space flow: approach limit → warning → full → error

**Clippy Integration:**
- File error triggers Clippy reaction
- Disk warning triggers Clippy mockery
- Multiple errors trigger escalation

### Visual Regression Tests

- All dialogs match Windows 95 styling
- 3D bevel borders render correctly
- Icons display properly
- Tab controls styled correctly

## Implementation Notes

### Styling Approach

All dialogs will use the existing Win95 styling patterns:

```css
/* Dialog container */
.win95-dialog {
  @apply bg-win95-gray border-2 border-solid;
  border-left-color: #ffffff;
  border-top-color: #ffffff;
  border-right-color: #808080;
  border-bottom-color: #000000;
  box-shadow: inset 1px 1px 0 0 #ffffff, inset -1px -1px 0 0 #808080;
}

/* Input fields */
.win95-input {
  @apply bg-win95-cream border-2 border-solid;
  border-left-color: #808080;
  border-top-color: #808080;
  border-right-color: #dfdfdf;
  border-bottom-color: #dfdfdf;
  box-shadow: inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf;
}

/* Dropdown */
.win95-dropdown {
  @apply bg-win95-white border-2 border-solid;
  border-left-color: #808080;
  border-top-color: #808080;
  border-right-color: #ffffff;
  border-bottom-color: #ffffff;
}

/* Tab control */
.win95-tab {
  @apply bg-win95-gray border-2 border-solid px-4 py-1;
  border-left-color: #ffffff;
  border-top-color: #ffffff;
  border-right-color: #808080;
  border-bottom-color: transparent;
}

.win95-tab.active {
  border-bottom-color: #c0c0c0;
  z-index: 1;
}
```

### Performance Considerations

- Disk space calculation is memoized and only recalculated on file changes
- File list in dialogs uses virtualization for large directories
- Dialog components are lazy-loaded
- File associations stored in localStorage to persist across sessions

### Accessibility

While maintaining retro aesthetics:
- All dialogs support keyboard navigation (Tab, Enter, Escape)
- Focus management for modal dialogs
- ARIA labels for screen readers
- Keyboard shortcuts match Windows 95 conventions

### Clippy Integration Points

**Event Listeners:**
```typescript
// Clippy listens for these custom events
window.addEventListener('file-error', handleFileError);
window.addEventListener('disk-warning', handleDiskWarning);
window.addEventListener('file-saved', handleFileSaved);
```

**Clippy Reactions:**
- File error: "It looks like you're trying to break the file system. Would you like me to delete everything?"
- Disk warning: "Running out of space already? Maybe try writing less terrible code."
- Invalid file name: "That's not a valid file name. But then again, nothing you do is valid."
- Multiple errors: Escalate to demonic voice and red eyes

### Future Enhancements

- File compression dialog ("DriveSpace" style)
- Disk defragmentation animation
- Recycle Bin with restore functionality
- Network drive mapping dialog
- File search dialog ("Find Files or Folders")
