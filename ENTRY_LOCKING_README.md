# Entry Locking System

## Overview
This feature implements a collaborative entry locking system that allows generation team users to select and edit specific entries without conflicts. When a user selects an entry for editing, it becomes locked and unavailable to other users, preventing data conflicts and ensuring data integrity.

## Features

### 1. Entry Selection and Locking
- **Pick and Choose**: Generation users can select specific entries they want to work on
- **Real-time Locking**: When an entry is selected, it's immediately locked for that user
- **Visual Indicators**: Clear visual indicators show entry status (available, locked by you, locked by others, completed)

### 2. Collaborative Editing
- **Exclusive Access**: Only one user can edit an entry at a time
- **Lock Duration**: Locks automatically expire after 30 minutes of inactivity
- **Lock Release**: Users can manually unlock entries they've selected

### 3. Visual Interface
- **Table View**: Similar to the reference image, showing all entry details in a structured table
- **Status Badges**: Color-coded badges for risk levels, deployment status, and completion status
- **Action Buttons**: Context-sensitive buttons based on entry status

### 4. Auto-refresh System
- **Real-time Updates**: Interface refreshes every 30 seconds to show current lock status
- **Background Sync**: Automatically syncs with server to show latest entry states

## How It Works

### For Generation Team Users:

1. **Access the Sheet Editor**
   - Navigate to "My Sheets" from the dashboard
   - Click "Select & Edit" on any assigned sheet

2. **Select an Entry**
   - Click the "Select" button on any available entry
   - The entry becomes locked and highlighted in yellow
   - Other users will see this entry as unavailable

3. **Edit the Entry**
   - Click the "Edit" button on your locked entry
   - Fill out the form with updated information
   - Click "Complete Entry" to save and unlock

4. **Release Locks**
   - Click "Unlock" to release an entry without completing it
   - Locks automatically expire after 30 minutes

### Visual Status Indicators:

- **White Background**: Available for selection
- **Yellow Background**: Locked by you (editable)
- **Gray Background**: Locked by another user
- **Green Background**: Completed entry

## Database Schema Changes

### New Columns in `sheet_entries`:
- `locked_by_user_id`: ID of user who has locked the entry
- `locked_at`: Timestamp when entry was locked
- `is_completed`: Boolean indicating if entry is completed
- `completed_at`: Timestamp when entry was completed

## API Endpoints

### Entry Locking Routes (`/api/entry-locking`):
- `POST /:entryId/lock` - Lock an entry for editing
- `POST /:entryId/unlock` - Unlock an entry
- `PUT /:entryId/complete` - Complete and unlock an entry
- `GET /sheet/:sheetId/available` - Get available entries for a sheet
- `GET /my-locked` - Get entries locked by current user
- `POST /release-expired` - Admin function to release expired locks

## Security & Permissions

- **Authentication Required**: All endpoints require valid JWT token
- **Permission-Based**: Users need `fill_sheets` permission to use locking features
- **Team-Based Filtering**: Users only see entries assigned to their team
- **Auto-Expiration**: Locks automatically expire to prevent permanent blocking

## Components

### Frontend Components:
- `SheetEditorWithLocking.js` - Main entry editing interface
- `SheetEditorWithLocking.css` - Styling for the interface

### Backend Services:
- `EntryLockingService.js` - Core locking logic
- `entryLockingController.js` - API controller
- `entryLocking.js` - Route definitions

## Installation & Setup

1. **Run Database Migration**:
   ```bash
   cd backend
   npm run migrate
   ```

2. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend Server**:
   ```bash
   cd frontend
   npm start
   ```

4. **Access the Feature**:
   - Login as a generation team user
   - Navigate to "My Sheets"
   - Click "Select & Edit" on any assigned sheet

## Configuration

### Lock Timeout:
The lock timeout is currently set to 30 minutes and can be configured in:
- `EntryLockingService.js` (line with `30 * 60 * 1000`)

### Auto-refresh Interval:
The interface refresh rate is set to 30 seconds and can be configured in:
- `SheetEditorWithLocking.js` (line with `30000`)

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration for instant lock updates
2. **Lock Transfer**: Admin ability to transfer locks between users
3. **Bulk Operations**: Select and lock multiple entries at once
4. **Lock History**: Audit trail of entry lock/unlock activities
5. **Custom Lock Duration**: User-configurable lock timeouts
