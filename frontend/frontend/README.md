# Advisory Tracker Frontend

React-based frontend application for the Advisory Tracker System.

## Features

- **User Authentication**: Secure login system with JWT tokens
- **Dashboard**: Overview of advisory entries with statistics and charts
- **Sheet Upload**: Upload Excel/CSV files with advisory data
- **Entry Management**: View, filter, and manage advisory entries
- **Advanced Filtering**: Multi-criteria filtering with comprehensive options
- **Responsive Design**: Mobile-friendly interface using Bootstrap
- **Role-based Access**: Different views based on user roles

## Technology Stack

- **React 18.2.0**: Frontend framework
- **React Router DOM**: Client-side routing
- **Bootstrap 5.2.0**: UI framework and styling
- **Axios**: HTTP client for API calls
- **Font Awesome**: Icons and visual elements

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   └── Login.js
│   │   ├── Dashboard/
│   │   │   └── Dashboard.js
│   │   ├── SheetUpload/
│   │   │   └── SheetUpload.js
│   │   ├── EntryList/
│   │   │   └── EntryList.js
│   │   └── Filters/
│   │       └── Filters.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── sheetService.js
│   │   └── vendorProductService.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Backend API running on http://localhost:3000

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and visit http://localhost:3001

## Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:3000/api
```

## Available Scripts

- `npm start`: Start development server
- `npm build`: Create production build
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

## API Integration

The frontend communicates with the backend API through service modules:

- **authService**: Authentication and user management
- **sheetService**: Sheet upload and entry management
- **vendorProductService**: Vendor and product operations

## Features by Component

### Login Component
- Secure authentication form
- Error handling and validation
- Responsive design

### Dashboard Component
- Statistics overview with cards
- Recent entries table
- Quick action buttons
- Risk level visualization

### SheetUpload Component
- File upload with drag-and-drop
- Month/year selection
- Progress tracking
- Upload result summary

### EntryList Component
- Paginated entry display
- Sorting capabilities
- Search functionality
- Delete operations

### Filters Component
- Multi-criteria filtering
- Advanced options toggle
- Real-time filter application
- Export capabilities

## Styling

The application uses Bootstrap 5.2.0 for styling with custom CSS enhancements:

- Responsive grid system
- Custom dashboard cards
- Risk level color coding
- Interactive form elements
- Loading states and animations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code structure
2. Use meaningful component names
3. Implement proper error handling
4. Add comments for complex logic
5. Test components thoroughly

## License

This project is part of the Advisory Tracker System.
