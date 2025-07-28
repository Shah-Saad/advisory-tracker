# Advisory Tracker Backend

A comprehensive backend API for managing advisory tracker system with role-based access control (RBAC) and monthly sheet distribution workflow.

## Features

- **Role-Based Access Control (RBAC)**: Complete permission-based user management system
- **Team Management**: Organize users into teams (Distribution, Transmission, General)
- **Monthly Sheet Workflow**: Admin uploads monthly sheets, distributes to teams, collects responses
- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Database Management**: PostgreSQL with Knex.js ORM for migrations and queries

## Architecture

### RBAC System
- **Roles**: Admin, Team Lead, Team Member
- **Permissions**: Granular permissions for users, teams, sheets management
- **Users**: Authenticated users with role assignments and team memberships

### Sheet Workflow
- **Sheets**: Monthly sheets uploaded by admin
- **Team Sheets**: Assignment tracking for teams
- **Sheet Responses**: Team responses and data collection
- **Export**: Database export of collected responses

## Getting Started

### Prerequisites
- Node.js (>= 16.0.0)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=advisory_tracker
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

3. Create the PostgreSQL database:
```sql
CREATE DATABASE advisory_tracker;
```

4. Run migrations to create tables:
```bash
npm run migrate
```

5. Seed default data (roles, permissions, teams, admin user):
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

## Default Setup

After running seeds, you'll have:

### Default Admin User
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@advisorytracker.com`

### Default Teams
- **Distribution**: Power distribution networks team
- **Transmission**: Power transmission infrastructure team  
- **General**: Cross-functional activities and administration team

### Default Roles & Permissions
- **Admin**: Full system access
- **Team Lead**: Team and sheet management permissions
- **Team Member**: Basic read and sheet filling permissions

## API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### User Management (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:userId/assign-team/:teamId` - Assign user to team

### Team Management
- `GET /api/teams` - Get all teams
- `GET /api/teams/active` - Get active teams
- `GET /api/teams/:id` - Get team by ID
- `GET /api/teams/:id/members` - Get team members
- `POST /api/teams` - Create team (Admin)
- `PUT /api/teams/:id` - Update team (Admin)
- `DELETE /api/teams/:id` - Delete team (Admin)
- `POST /api/teams/:teamId/members/:userId` - Add member to team (Admin)
- `DELETE /api/teams/members/:userId` - Remove member from team (Admin)

### Sheet Management
- `GET /api/sheets` - Get all sheets
- `GET /api/sheets/filtered` - Get sheets with month/year/status filters
- `GET /api/sheets/my-team` - Get current user's team sheets
- `GET /api/sheets/summary/:year/:month` - Get monthly sheet summary
- `POST /api/sheets` - Upload new monthly sheet (Admin)
- `POST /api/sheets/:id/distribute` - Distribute sheet to all teams (Admin)
- `GET /api/sheets/:id/filtered-data` - Get filtered sheet responses (Admin)
- `POST /api/sheets/team-sheets/:teamSheetId/submit` - Submit team response
- `GET /api/sheets/:id/export` - Export sheet responses with filters (Admin)

### Role & Permission Management (Admin only)
- `GET /api/roles` - Get all roles
- `GET /api/permissions` - Get all permissions
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

## Database Schema

### Core Tables
- `users` - User accounts with role and team assignments
- `roles` - System roles (Admin, Team Lead, Team Member)
- `permissions` - Granular permissions for actions
- `role_permissions` - Role-permission mappings
- `teams` - Organization teams (Distribution, Transmission, General)

### Workflow Tables
- `sheets` - Monthly sheets uploaded by admin
- `team_sheets` - Sheet assignments to teams
- `sheet_responses` - Team responses and filled data

## Monthly Sheet Workflow

1. **Admin uploads monthly sheet**:
   ```bash
   POST /api/sheets
   # Uploads Excel/CSV file for the month
   ```

2. **Admin distributes to all teams**:
   ```bash
   POST /api/sheets/:id/distribute
   # Creates assignments for all active teams
   ```

3. **Teams fill out their sheets**:
   ```bash
   POST /api/sheets/team-sheets/:teamSheetId/submit
   # Team members submit their responses
   ```

4. **Admin exports collected data**:
   ```bash
   GET /api/sheets/:id/export
   # Downloads compiled responses from all teams
   ```

## Advanced Filtering & Analysis

The system provides powerful filtering capabilities for admins to analyze sheet data:

### Monthly Analysis
- Filter sheets by year and month
- View monthly summaries and statistics
- Track completion rates across teams

### Data Filtering
- Filter by deployment status: `deployed_in_ke=Yes/No`
- Filter by location, product name, or status
- Filter by specific teams or date ranges
- Export filtered data in JSON or CSV format

### Example Usage
```bash
# Get all products deployed in Kenya for July 2025
GET /api/sheets/123/filtered-data?deployed_in_ke=Yes&year=2025&month=7

# Export CSV of Nairobi deployments by Distribution team
GET /api/sheets/123/export?format=csv&location=Nairobi&team_id=1
```

See [FILTERING_API.md](FILTERING_API.md) for complete filtering documentation.

## Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback last migration
- `npm run migrate:make` - Create new migration
- `npm run seed` - Run database seeds
- `npm test` - Run tests

### Project Structure
```
src/
├── config/
│   └── knexfile.js          # Database configuration
├── controllers/             # HTTP request handlers
├── middlewares/            # Authentication & RBAC middleware
├── models/                 # Database models
├── routes/                 # API route definitions
├── services/               # Business logic layer
├── app.js                  # Express app configuration
└── server.js              # Server entry point
migrations/                 # Database migrations
seeds/                     # Database seed files
```

## Security Features

- JWT-based authentication
- bcrypt password hashing with salt rounds
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS and Helmet security headers
- Permission-based route protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details
