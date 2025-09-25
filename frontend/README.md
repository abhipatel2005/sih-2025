# Attendee Attendee System - Frontend

A React + Tailwind CSS frontend for the enhanced attendance system with JWT authentication, user management, and role-based access control.

## Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication**: Secure login/logout system
- **Role-based Access Control**: Admin, mentor, and member roles
- **Protected Routes**: Route protection based on user roles
- **Session Management**: Automatic token refresh and logout

### 👥 User Management (Admin Only)
- **Member Directory**: View, search, and manage all users
- **Admin Signup**: Register new users via `/auth/register` endpoint
- **User CRUD Operations**: Create, read, update, delete users
- **User Status Management**: Activate/deactivate users
- **Role Assignment**: Assign roles (admin, mentor, member)

### 📊 Attendance System
- **Real-time Data**: Fetches attendance data from the backend API
- **Search Functionality**: Filter attendance records by name
- **Auto-refresh**: Automatically updates data every 30 seconds
- **Role Display**: Shows user roles in attendance records
- **Responsive Design**: Works on desktop and mobile devices

### 🎨 Modern UI/UX
- **Clean Interface**: Professional design built with Tailwind CSS
- **Modal Forms**: User-friendly forms for member management
- **Toast Notifications**: Real-time feedback for user actions
- **Loading States**: Smooth loading indicators
- **Error Handling**: Comprehensive error handling and display

## Pages & Components

### Pages
- **Login**: Authentication page for admin users
- **Attendance**: Dashboard showing today's attendance
- **Members**: User management page (admin only)
- **Signup**: User registration page (admin only)

### Key Components
- **AuthContext**: Authentication state management
- **ToastContext**: Toast notification system
- **ProtectedRoute**: Route protection component
- **Navigation**: Main navigation bar
- **MemberFormModal**: User creation/editing modal
- **AttendanceTable**: Attendance data display
- **SearchBar**: Search functionality component

## Prerequisites

- Node.js (v14 or higher)
- Backend server running on `http://localhost:3000`
- Admin user created in the backend system

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

The frontend connects to the backend at `http://localhost:3000`. This is configured in `src/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000';
```

For production deployment, update this URL accordingly.

### 3. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173` (Vite default port).

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## Usage

### 🔑 Login Process
1. Navigate to the application
2. Use admin credentials to login:
   - Email: `admin@launchlog.com`
   - Password: `admin123456` (change after first login)

### 👥 User Management
1. **View Members**: Go to "Members" page to see all users
2. **Register New User**: Click "Register New User" or use the "Signup" navigation link
3. **Add Member**: Use "Add Member" for quick user creation via modal
4. **Edit Users**: Click edit icon in the member list
5. **Manage Status**: Toggle user active/inactive status

### 📊 Attendance Tracking
1. **View Today's Attendance**: Default dashboard view
2. **Search Records**: Use the search bar to filter by name
3. **Auto-refresh**: Data updates automatically every 30 seconds

## API Integration

The frontend integrates with the following backend endpoints:

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - Register new user (admin only)
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info
- `POST /auth/change-password` - Change password

### User Management Endpoints
- `GET /users` - List all users (admin only)
- `GET /users/:id` - Get single user
- `POST /users` - Create user (admin only)
- `PUT /users/:id` - Update user (admin only)
- `DELETE /users/:id` - Delete user (admin only)
- `PUT /users/:id/status` - Toggle user status (admin only)
- `GET /users/stats/summary` - Get user statistics

### Attendance Endpoints
- `GET /attendance/today` - Get today's attendance
- `GET /attendance/history` - Get attendance history
- `GET /attendance/user/:userId` - Get user attendance
- `GET /attendance/stats` - Get attendance statistics
- `DELETE /attendance/:id` - Delete attendance record

## Authentication Flow

1. **Login**: User enters credentials, receives JWT token
2. **Token Storage**: Token stored in localStorage
3. **API Requests**: Token automatically attached to all API calls
4. **Route Protection**: Protected routes check authentication status
5. **Auto Logout**: Invalid/expired tokens trigger automatic logout

## Role-based Access

- **Admin**: Full access to all features
- **Mentor**: Can view attendance history and manage records
- **Member**: Basic attendance viewing only

## Error Handling

- **API Errors**: Displayed via toast notifications
- **Network Issues**: Automatic retry mechanisms
- **Authentication Errors**: Redirect to login page
- **Form Validation**: Real-time validation with error messages

### GET /attendance/today

Returns today's attendance records with user information populated:

```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "userId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "rfidTag": "04A1B2C3"
    },
    "timestamp": "2025-08-15T09:30:00.000Z"
  }
]
```

## Features Overview

### 📊 Dashboard Stats
- Total check-ins today
- Filtered results count
- Auto-refresh status

### 🔍 Search Functionality
- Real-time search as you type
- Case-insensitive name filtering
- Search results update instantly

### 📋 Attendance Table
- User avatar with initials
- Full name display
- RFID tag information
- Formatted check-in time
- Date information
- Hover effects for better UX

### ⚡ Auto-refresh
- Updates every 30 seconds automatically
- Manual refresh button available
- Loading states and error handling

### 📱 Responsive Design
- Works on all screen sizes
- Mobile-optimized table layout
- Touch-friendly interface

## Error Handling

The application handles various error states:

- **Network Errors**: Shows error message if backend is unavailable
- **Loading States**: Displays spinner during data fetch
- **Empty Data**: Shows helpful message when no records exist
- **Search Results**: Shows appropriate message when search yields no results

## License

MIT+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
