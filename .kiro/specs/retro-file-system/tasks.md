# Implementation Plan: Retro File System Features

- [x] 1. Enhance FileSystemContext with disk space tracking and file associations
  - Add disk space state (used, limit, thresholds) to FileSystemContext
  - Implement `calculateDiskSpace()` method that recursively sums file content lengths
  - Implement `checkDiskSpace(fileSize)` validation method
  - Add file associations Map to context state
  - Implement `setFileAssociation()` and `getFileAssociation()` methods
  - Add dialog visibility state flags (showSaveAsDialog, showOpenDialog, etc.)
  - Add error dialog state (errorDialogMessage, errorDialogCode)
  - Implement `triggerFileError()` method that sets error state and emits events
  - Implement `getFileProperties()` method that returns FileProperties object
  - Update `createFile()` and `updateFileContent()` to check disk space before operations
  - Update all file operations to recalculate disk space after changes
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 6.1_

- [ ] 2. Create SaveAsDialog component
  - [ ] 2.1 Build SaveAsDialog component structure with Win95 styling
    - Create SaveAsDialog.tsx component file
    - Implement dialog props interface (isOpen, currentFileName, currentContent, onSave, onCancel)
    - Add Win95 dialog container with proper border styling
    - Add title bar with "Save As" text and close button
    - Implement modal overlay with click-outside-to-close behavior
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.2 Implement directory navigation and file list
    - Add "Save in" dropdown showing current directory path
    - Integrate FileTree component logic for directory browsing
    - Display folder and file icons in the list view
    - Implement folder expansion/collapse functionality
    - Add click handler to navigate into folders
    - _Requirements: 1.1, 1.3_
  
  - [ ] 2.3 Add file name input and file type selector
    - Create file name input field with Win95 input styling
    - Add "Save as type" dropdown with file type filters (*.txt, *.js, *.py, *.c, *.cpp, *.java, All Files)
    - Pre-populate file name input with current file name
    - Implement file extension auto-append based on selected type
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.4 Implement save validation and error handling
    - Add file name validation (invalid characters, reserved names, length limits)
    - Check for existing file and show overwrite confirmation
    - Validate disk space before save
    - Trigger FileErrorDialog on validation failure
    - Call onSave callback with validated path and name
    - _Requirements: 1.5, 4.1, 4.4_
  
  - [ ] 2.5 Write unit tests for SaveAsDialog
    - Test dialog renders with correct Win95 styling
    - Test file name validation catches invalid characters
    - Test directory navigation updates current path
    - Test save callback is called with correct parameters
    - Test cancel closes dialog without saving
    - _Requirements: 1.1, 1.5_

- [ ] 3. Create OpenFileDialog component
  - [ ] 3.1 Build OpenFileDialog component structure
    - Create OpenFileDialog.tsx component file
    - Implement dialog props interface (isOpen, onOpen, onCancel)
    - Add Win95 dialog container with title bar
    - Implement modal overlay behavior
    - _Requirements: 5.1, 5.4_
  
  - [ ] 3.2 Implement file browsing interface
    - Add "Look in" dropdown for directory navigation
    - Create file list view with columns (Name, Size, Modified)
    - Display file icons and folder icons
    - Show file size in KB/MB format
    - Show modified date in MM/DD/YYYY format
    - Implement folder double-click to navigate
    - _Requirements: 5.2, 5.3_
  
  - [ ] 3.3 Add file selection and filtering
    - Add "Files of type" dropdown with file type filters
    - Filter displayed files based on selected type
    - Implement single-click to select file
    - Update "File name" input with selected file name
    - Implement double-click to open file
    - _Requirements: 5.2, 5.5_
  
  - [ ] 3.4 Wire up open functionality
    - Add Open button that calls onOpen with selected file path
    - Add Cancel button that closes dialog
    - Validate file exists before calling onOpen
    - Handle file association check for unknown extensions
    - _Requirements: 5.5_
  
  - [ ] 3.5 Write unit tests for OpenFileDialog
    - Test dialog displays file list correctly
    - Test file type filtering works
    - Test double-click opens file
    - Test Open button calls callback with correct path
    - _Requirements: 5.1, 5.2, 5.5_

- [ ] 4. Create FileAssociationDialog component
  - [ ] 4.1 Build FileAssociationDialog component
    - Create FileAssociationDialog.tsx component file
    - Implement props interface (isOpen, fileName, extension, onSelectAssociation, onCancel)
    - Add Win95 dialog with warning icon
    - Display "Windows cannot open this file" message with file name
    - _Requirements: 3.1, 3.4_
  
  - [ ] 4.2 Implement application selection interface
    - Add radio button list with handler options (Text Editor, Code Viewer, View as Text)
    - Add "Always use this program" checkbox
    - Style radio buttons and checkbox with Win95 styling
    - _Requirements: 3.2, 3.3_
  
  - [ ] 4.3 Wire up association selection
    - Add OK button that calls onSelectAssociation with selected handler and remember flag
    - Add Cancel button that closes dialog
    - Store association in FileSystemContext if remember is true
    - _Requirements: 3.5_
  
  - [ ] 4.4 Write unit tests for FileAssociationDialog
    - Test dialog displays file name and extension
    - Test radio button selection works
    - Test checkbox state is passed to callback
    - Test association is stored when remember is checked
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 5. Create FilePropertiesDialog component
  - [ ] 5.1 Build FilePropertiesDialog with tabbed interface
    - Create FilePropertiesDialog.tsx component file
    - Implement props interface (isOpen, filePath, onClose)
    - Add Win95 dialog with tabbed interface styling
    - Create "General" tab with Win95 tab styling
    - Add file icon display at top of dialog
    - _Requirements: 6.1, 6.3_
  
  - [ ] 5.2 Display file properties
    - Fetch file properties using getFileProperties() from context
    - Display file name, type, location as read-only fields
    - Display file size in both bytes and KB format (e.g., "1,234 bytes (1.2 KB)")
    - Display created, modified, and accessed dates in readable format
    - _Requirements: 6.2, 6.4_
  
  - [ ] 5.3 Add dialog buttons
    - Add OK button that closes dialog
    - Add Cancel button that closes dialog
    - Add Apply button (disabled for read-only properties)
    - Style buttons with Win95 button styling
    - _Requirements: 6.5_
  
  - [ ] 5.4 Write unit tests for FilePropertiesDialog
    - Test dialog displays correct file metadata
    - Test file size formatting (bytes and KB)
    - Test date formatting
    - Test OK button closes dialog
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 6. Create DiskSpaceWarning component
  - [ ] 6.1 Build DiskSpaceWarning dialog
    - Create DiskSpaceWarning.tsx component file
    - Implement props interface (isOpen, spaceUsed, spaceLimit, onClose)
    - Add Win95 dialog with yellow warning icon
    - Display "Low Disk Space" title
    - _Requirements: 2.3_
  
  - [ ] 6.2 Display disk usage information
    - Calculate and display percentage used
    - Format space used and limit in MB
    - Display warning message about running out of space
    - Add suggestion to delete files
    - _Requirements: 2.2, 2.3_
  
  - [ ] 6.3 Integrate with GameContext and Clippy
    - Trigger anger level increase when warning is shown
    - Emit custom event for Clippy to react
    - Add OK button that closes dialog and calls onClose
    - _Requirements: 2.3, 7.2_
  
  - [ ] 6.4 Write unit tests for DiskSpaceWarning
    - Test dialog displays correct usage percentage
    - Test space formatting (MB)
    - Test OK button closes dialog
    - Test anger level increases when shown
    - _Requirements: 2.2, 2.3, 7.2_

- [ ] 7. Create FileErrorDialog component
  - [ ] 7.1 Build FileErrorDialog component
    - Create FileErrorDialog.tsx component file
    - Implement props interface (isOpen, errorMessage, errorCode, clippyMessage, onClose)
    - Add Win95 dialog with red X error icon
    - Display "Error" title in title bar
    - _Requirements: 4.2, 4.3_
  
  - [ ] 7.2 Display error information
    - Display error message text
    - Display error code in format "Error 0x[HEX_CODE]"
    - Conditionally display Clippy sarcastic message if provided
    - Style error text appropriately
    - _Requirements: 4.2, 4.3_
  
  - [ ] 7.3 Integrate with GameContext
    - Trigger anger level increase when error is shown
    - Emit custom event for Clippy to react
    - Add OK button that closes dialog
    - Track error frequency for escalation (3+ errors in 30 seconds)
    - _Requirements: 4.1, 4.4, 4.5, 7.1, 7.4_
  
  - [ ] 7.4 Write unit tests for FileErrorDialog
    - Test dialog displays error message and code
    - Test Clippy message is shown when provided
    - Test OK button closes dialog
    - Test anger level increases when shown
    - Test error frequency tracking
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.4_

- [x] 8. Define error codes and validation utilities
  - Create fileSystemErrors.ts utility file
  - Define FILE_ERROR_CODES constant with all error codes (INVALID_NAME, FILE_NOT_FOUND, ACCESS_DENIED, DISK_FULL, FILE_EXISTS, PATH_TOO_LONG)
  - Implement validateFileName() function that checks for invalid characters and reserved names
  - Implement validatePath() function that checks path length limits
  - Implement getErrorMessage() function that returns user-friendly message for error type
  - Implement formatFileSize() utility to convert bytes to readable format
  - Implement formatDate() utility for consistent date formatting
  - _Requirements: 4.1, 4.3, 6.2, 6.4_

- [ ] 9. Integrate dialogs with FileSystemContext
  - Update FileSystemContext to render all new dialog components
  - Pass dialog visibility state and callbacks to each dialog
  - Wire up SaveAsDialog to createFile() method
  - Wire up OpenFileDialog to openFile() method
  - Wire up FileAssociationDialog to file open operations
  - Wire up FilePropertiesDialog to context menu "Properties" action
  - Wire up DiskSpaceWarning to disk space threshold checks
  - Wire up FileErrorDialog to all error scenarios
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 10. Add file properties context menu option
  - Update FileTree component to add "Properties" option to context menu
  - Implement click handler that triggers FilePropertiesDialog
  - Pass selected file path to dialog
  - _Requirements: 6.1_

- [ ] 11. Implement Clippy event listeners for file system events
  - Add event listener in ClippyAgent for 'file-error' custom event
  - Add event listener for 'disk-warning' custom event
  - Add event listener for 'file-saved' custom event
  - Implement Clippy reaction messages for each event type
  - Implement escalation logic for multiple errors (3+ in 30 seconds triggers demonic mode)
  - _Requirements: 7.2, 7.3, 7.5_

- [ ] 12. Add localStorage persistence for file associations
  - Implement saveFileAssociations() function to persist to localStorage
  - Implement loadFileAssociations() function to restore from localStorage
  - Call loadFileAssociations() on FileSystemContext initialization
  - Call saveFileAssociations() whenever associations are updated
  - _Requirements: 3.5_

- [ ] 13. Update MenuBar to use new dialogs
  - Replace existing "Save As" dialog with new SaveAsDialog component
  - Add "Open File..." menu item that triggers OpenFileDialog
  - Update "Properties" menu item to trigger FilePropertiesDialog for active file
  - _Requirements: 1.1, 5.1, 6.1_

- [ ] 14. Add keyboard shortcuts for dialogs
  - Add Ctrl+Shift+S shortcut for Save As dialog
  - Add Ctrl+O shortcut for Open File dialog
  - Add Alt+Enter shortcut for Properties dialog (when file is selected)
  - Update useKeyboardShortcuts hook with new shortcuts
  - _Requirements: 1.1, 5.1, 6.1_

- [ ] 15. Create integration tests for complete file operation flows
  - Test Save As flow: trigger dialog → navigate directory → enter name → save → verify file created
  - Test Open flow: trigger dialog → browse files → select file → open → verify file opened
  - Test error flow: attempt invalid operation → verify error dialog shown → verify anger increased
  - Test disk space flow: fill disk to 80% → verify warning shown → fill to 100% → verify error shown
  - Test file association flow: open unknown file → select association → verify stored → open again → verify no dialog
  - Test Clippy integration: trigger file error → verify Clippy reacts → trigger multiple errors → verify escalation
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 7.1, 7.2, 7.3, 7.4, 7.5_
