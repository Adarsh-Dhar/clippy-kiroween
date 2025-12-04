# Requirements Document

## Introduction

This feature implements authentic Windows 95-era file system interactions and dialogs to enhance the retro IDE experience. The system will provide period-accurate file management dialogs, warnings, and error messages that align with the application's resurrection theme and punishing user experience philosophy.

## Glossary

- **File System Manager**: The component responsible for managing file operations and triggering retro-styled dialogs
- **Save As Dialog**: A Windows 95-styled modal dialog for saving files with name and location selection
- **File Association Dialog**: A dialog that appears when opening files without recognized extensions
- **Disk Space Monitor**: A system that tracks virtual disk space and displays warnings
- **Error Dialog**: A Windows 95-styled modal displaying file operation errors with iconic styling

## Requirements

### Requirement 1

**User Story:** As a user, I want to see an authentic Windows 95 "Save As" dialog when saving files, so that I experience the nostalgic file management interface

#### Acceptance Criteria

1. WHEN the user triggers a save operation for a new file, THE File System Manager SHALL display a Save As Dialog with Windows 95 styling
2. THE Save As Dialog SHALL include a file name input field, directory tree navigation, and file type dropdown selector
3. THE Save As Dialog SHALL use the classic 3D bevel borders with light source from top-left (white highlight, dark gray shadow)
4. THE Save As Dialog SHALL display "Save" and "Cancel" buttons with Windows 95 button styling
5. WHEN the user confirms the save operation, THE File System Manager SHALL validate the file name and save the file to the selected location

### Requirement 2

**User Story:** As a user, I want to receive disk space warnings in Windows 95 style, so that I feel the authentic pressure of limited storage

#### Acceptance Criteria

1. THE Disk Space Monitor SHALL track the total size of files in the virtual file system
2. WHEN the virtual disk usage exceeds 80 percent of the allocated limit, THE Disk Space Monitor SHALL display a low disk space warning dialog
3. THE low disk space warning dialog SHALL use Windows 95 warning icon (yellow triangle with exclamation mark) and styling
4. WHEN the virtual disk usage reaches 100 percent, THE File System Manager SHALL prevent new file creation and display a "Disk Full" error dialog
5. THE Disk Space Monitor SHALL update the disk space calculation after each file operation (save, delete, modify)

### Requirement 3

**User Story:** As a user, I want to see file association dialogs when opening unknown file types, so that I experience the classic Windows file handling behavior

#### Acceptance Criteria

1. WHEN the user attempts to open a file with an unrecognized extension, THE File System Manager SHALL display a File Association Dialog
2. THE File Association Dialog SHALL present options to select an application or view the file as text
3. THE File Association Dialog SHALL include a checkbox option "Always use this program to open this file type"
4. THE File Association Dialog SHALL use Windows 95 dialog styling with proper borders and button layouts
5. WHEN the user selects an association, THE File System Manager SHALL store the preference and apply it to future file operations

### Requirement 4

**User Story:** As a user, I want to encounter classic Windows 95 error dialogs for file operations, so that failures feel authentically retro and punishing

#### Acceptance Criteria

1. WHEN a file operation fails (invalid name, access denied, file not found), THE File System Manager SHALL display an Error Dialog with Windows 95 styling
2. THE Error Dialog SHALL include the iconic red X error icon and appropriate error message text
3. THE Error Dialog SHALL display error codes in the format "Error 0x[HEX_CODE]" for authenticity
4. THE Error Dialog SHALL include an "OK" button that dismisses the dialog without fixing the issue
5. WHEN displaying file operation errors, THE File System Manager SHALL integrate with Clippy to trigger appropriate anger level increases

### Requirement 5

**User Story:** As a user, I want to see a classic "Open File" dialog with retro styling, so that I can browse and select files in an authentic Windows 95 manner

#### Acceptance Criteria

1. WHEN the user triggers an open file operation, THE File System Manager SHALL display an Open File Dialog with Windows 95 styling
2. THE Open File Dialog SHALL include a directory tree view, file list with icons, and file type filter dropdown
3. THE Open File Dialog SHALL display file details (name, size, date modified) in a list view format
4. THE Open File Dialog SHALL include "Open" and "Cancel" buttons with proper Windows 95 styling
5. WHEN the user selects a file and confirms, THE File System Manager SHALL load the file into the editor

### Requirement 6

**User Story:** As a user, I want to see file property dialogs with retro styling, so that I can view file metadata in an authentic Windows 95 format

#### Acceptance Criteria

1. WHEN the user requests file properties (right-click or menu option), THE File System Manager SHALL display a Properties Dialog with tabbed interface
2. THE Properties Dialog SHALL include a "General" tab displaying file name, type, location, size, and dates (created, modified, accessed)
3. THE Properties Dialog SHALL use Windows 95 tab control styling with raised tabs and proper borders
4. THE Properties Dialog SHALL display file size in both bytes and kilobytes format
5. THE Properties Dialog SHALL include "OK", "Cancel", and "Apply" buttons at the bottom with proper spacing

### Requirement 7

**User Story:** As a developer maintaining the system, I want file dialogs to integrate with the anger state machine, so that errors and warnings contribute to the haunted experience

#### Acceptance Criteria

1. WHEN a file operation error occurs, THE File System Manager SHALL trigger an anger level increase in the Game Context
2. WHEN the disk space warning appears, THE File System Manager SHALL trigger Clippy to display a mocking message about the user's file management
3. THE Error Dialog SHALL support displaying Clippy-generated sarcastic error messages alongside standard error text
4. WHEN multiple file errors occur in succession (more than 3 within 30 seconds), THE File System Manager SHALL trigger escalated anger responses
5. THE File System Manager SHALL emit events that Clippy can subscribe to for contextual reactions
