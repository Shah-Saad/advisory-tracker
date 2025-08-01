# Team-Specific Sheet API Endpoints

## New Admin Endpoints for Team-Specific Sheet Views

The admin can now view different versions of sheets that have been edited by different teams. Here are the new API endpoints:

### 1. Get All Sheets with Team Status Summary
**GET** `/api/sheets/team-status-summary`

**Permission Required:** `read_sheets`

**Description:** Returns all sheets with a summary of team assignments and response status.

**Response Example:**
```json
[
  {
    "id": 1,
    "title": "Monthly Advisory Report - January 2025",
    "description": "Monthly report for all teams",
    "status": "distributed",
    "month_year": "2025-01-01",
    "teams": [
      {
        "team_id": 1,
        "team_name": "Generation",
        "status": "completed",
        "assigned_at": "2025-01-01T10:00:00.000Z",
        "completed_at": "2025-01-15T14:30:00.000Z",
        "response_count": 25,
        "has_responses": true
      },
      {
        "team_id": 2,
        "team_name": "Distribution",
        "status": "in_progress",
        "assigned_at": "2025-01-01T10:00:00.000Z",
        "completed_at": null,
        "response_count": 15,
        "has_responses": true
      }
    ],
    "total_teams_assigned": 3,
    "teams_with_responses": 2,
    "teams_completed": 1
  }
]
```

### 2. Get Team-Specific Views of a Sheet
**GET** `/api/sheets/:id/team-views`

**Permission Required:** `read_sheets`

**Description:** Returns a specific sheet with all team-specific versions/responses.

**Response Example:**
```json
{
  "sheet": {
    "id": 1,
    "title": "Monthly Advisory Report - January 2025",
    "description": "Monthly report for all teams",
    "status": "distributed"
  },
  "team_versions": [
    {
      "team_id": 1,
      "team_name": "Generation",
      "assignment_status": "completed",
      "assigned_at": "2025-01-01T10:00:00.000Z",
      "completed_at": "2025-01-15T14:30:00.000Z",
      "responses": {
        "field1": {
          "value": "Generation team response",
          "type": "text",
          "submitted_at": "2025-01-15T14:30:00.000Z",
          "submitted_by": 5
        }
      },
      "response_count": 25
    },
    {
      "team_id": 2,
      "team_name": "Distribution",
      "assignment_status": "in_progress",
      "assigned_at": "2025-01-01T10:00:00.000Z",
      "completed_at": null,
      "responses": {
        "field1": {
          "value": "Distribution team response",
          "type": "text",
          "submitted_at": "2025-01-10T12:00:00.000Z",
          "submitted_by": 7
        }
      },
      "response_count": 15
    }
  ],
  "total_teams": 2
}
```

### 3. Get Specific Team's Version of a Sheet
**GET** `/api/sheets/:id/team/:teamId`

**Permission Required:** `read_sheets`

**Description:** Returns a specific team's version of a sheet with their responses.

**Response Example:**
```json
{
  "sheet": {
    "id": 1,
    "title": "Monthly Advisory Report - January 2025",
    "description": "Monthly report for all teams"
  },
  "team": {
    "team_id": 1,
    "team_name": "Generation",
    "assignment_status": "completed",
    "assigned_at": "2025-01-01T10:00:00.000Z",
    "completed_at": "2025-01-15T14:30:00.000Z"
  },
  "responses": {
    "field1": {
      "value": "Generation team response for field 1",
      "type": "text",
      "submitted_at": "2025-01-15T14:30:00.000Z",
      "submitted_by": 5
    },
    "field2": {
      "value": "Another response",
      "type": "text",
      "submitted_at": "2025-01-15T14:30:00.000Z",
      "submitted_by": 5
    }
  },
  "response_count": 25
}
```

## Use Cases

1. **Admin Dashboard Overview**: Use the team status summary endpoint to show a quick overview of all sheets and their completion status across teams.

2. **Detailed Sheet Review**: Use the team-views endpoint to see all team versions of a specific sheet side by side.

3. **Individual Team Review**: Use the specific team endpoint to focus on one team's responses to a sheet.

## Error Responses

- **404 Not Found**: Sheet not found or team not assigned to sheet
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: Server error

## Implementation Details

- All endpoints require admin-level permissions (`read_sheets`)
- Responses are grouped by field name for easy comparison between teams
- Assignment status shows the current state of each team's work
- Response counts help identify completion levels
- Timestamps track when teams were assigned and when they completed their work

This feature enables admins to see exactly how different teams have filled out the same sheet template, making it easy to compare responses and track progress across all teams.
