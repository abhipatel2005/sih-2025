# Attendee MVP - Backend

A simple attendance tracking system using RFID tags, built with Node.js, Express, and MongoDB.

## Features

- Record attendance using RFID tags
- View today's attendance logs
- User management with RFID tag association

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` file with your MongoDB connection string:

```
MONGODB_URI=mongodb://localhost:27017/attendance_system
PORT=3000
```

### 3. Start MongoDB

Make sure MongoDB is running locally, or use MongoDB Atlas cloud service.

For local MongoDB:
```bash
mongod
```

### 4. Run the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### POST /attendance

Record attendance for a user.

**Request Body:**
```json
{
  "rfidTag": "04A1B2C3",
  "timestamp": "2025-08-15 09:30:00"
}
```

**Response:**
```json
{
  "message": "Attendance recorded successfully",
  "attendance": {
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userName": "John Doe",
    "timestamp": "2025-08-15T09:30:00.000Z"
  }
}
```

### GET /attendance/today

Get all attendance records for today.

**Response:**
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

## Database Schema

### User Model

```javascript
{
  name: String,          // User's full name
  rfidTag: String        // Unique RFID tag ID (e.g., "04A1B2C3")
}
```

### Attendance Model

```javascript
{
  userId: ObjectId,      // Reference to User
  timestamp: Date        // When attendance was recorded
}
```

## Testing the API

You can test the API using curl, Postman, or any HTTP client:

### Record Attendance
```bash
curl -X POST http://localhost:3000/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "rfidTag": "04A1B2C3",
    "timestamp": "2025-08-15 09:30:00"
  }'
```

### Get Today's Attendance
```bash
curl http://localhost:3000/attendance/today
```

## Sample Data

To test the system, you'll need to create some users first. You can do this directly in MongoDB:

```javascript
// Connect to MongoDB and insert sample users
use attendance_system

db.users.insertMany([
  {
    name: "John Doe",
    rfidTag: "04A1B2C3"
  },
  {
    name: "Jane Smith", 
    rfidTag: "05B2C3D4"
  },
  {
    name: "Bob Johnson",
    rfidTag: "06C3D4E5"
  }
])
```

## Troubleshooting

### MongoDB Connection Issues

1. Ensure MongoDB is running
2. Check the MONGODB_URI in your .env file
3. For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use

If port 3000 is already in use, change the PORT in your .env file:
```
PORT=3001
```

## License

MIT
