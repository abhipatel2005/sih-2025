<div align="center">

# Smart Attendance Management System

### Revolutionizing Attendance Tracking with RFID Technology

**Smart India Hackathon 2025 Project**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-digitalhajri.site-0066cc?style=flat-square)](https://digitalhajri.site)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)

</div>

---

## Live Application

**Experience the system live at: [digitalhajri.site](https://digitalhajri.site)**

A comprehensive attendance management system with RFID integration, designed for modern educational institutions to streamline attendance tracking and improve administrative efficiency.

---

## Key Features

### Authentication & Security
- JWT-based secure authentication
- Multi-role access control (Admin/Teacher/Student)
- Password recovery via email
- Session management and data encryption
- Secure API endpoints with role-based permissions

### Analytics & Reporting
- Real-time attendance analytics and dashboards
- Interactive charts and trend analysis
- Comprehensive reporting system
- Export capabilities (PDF/Excel)
- Custom date range filtering and search

### RFID Integration
- Automatic attendance marking with RFID cards
- ESP32-based RFID reader terminals
- Real-time data synchronization
- Hardware status monitoring
- Support for multiple concurrent terminals

### Communication System
- Automated email notifications
- Password recovery and account management
- Attendance alerts and reminders
- Administrative notifications
- OAuth2 email integration

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern Interface**: Clean, intuitive UI built with Tailwind CSS
- **Real-time Updates**: Live data synchronization across all devices
- **Accessibility**: WCAG compliant design with proper contrast and navigation

---

## Project Architecture

```
Smart Attendance System
├── frontend/          # React application with Vite
│   ├── src/components/  # Reusable UI components
│   ├── src/pages/       # Application pages
│   ├── src/utils/       # Utility functions
│   └── src/hooks/       # Custom React hooks
├── backend/           # Node.js Express API
│   ├── routes/         # API route handlers
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   ├── middleware/     # Authentication & validation
│   └── config/         # Database & app configuration
├── firmware/           # Arduino/ESP32 RFID code
│   ├── attendance_system/ # Main RFID firmware
│   └── test_mfrc522v2/   # Hardware testing code
└── docs/               # Project documentation
```

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Git
- Supabase account (for database)
- ESP32 development board (for RFID)

### Local Development

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/sih-2025.git
cd sih-2025
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables (see below)
npm start
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### 4. Access the Application
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/

---

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Database Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174
```

#### Frontend (.env)
```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
VITE_API_URL=http://localhost:3000
```

---

## Technology Stack

<div align="center">

### **Frontend**
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

### **Backend**
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-0C7489?style=for-the-badge)](https://nodemailer.com/)

### **Database & Deployment**
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

### **Hardware**
[![Arduino](https://img.shields.io/badge/Arduino-00979D?style=for-the-badge&logo=Arduino&logoColor=white)](https://www.arduino.cc/)
[![ESP32](https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white)](https://www.espressif.com/)

</div>

---

## System Features in Detail

### For Administrators
- **Dashboard Overview**: Complete system statistics and analytics
- **User Management**: Add, edit, and manage teachers and students
- **School Management**: Multi-school support with hierarchical access
- **Reports Generation**: Comprehensive attendance reports and analytics
- **System Configuration**: Hardware management and system settings

### For Teachers
- **Class Management**: View and manage assigned classes
- **Attendance Tracking**: Real-time attendance monitoring
- **Student Profiles**: Access student information and attendance history
- **Manual Entry**: Override attendance when needed
- **Progress Reports**: Generate class-wise attendance reports

### For Students
- **Personal Dashboard**: View personal attendance records
- **Attendance History**: Detailed attendance timeline
- **Profile Management**: Update personal information
- **Notifications**: Receive attendance alerts and updates

### For Hardware Integration
- **RFID Terminals**: Multiple RFID reader support
- **Real-time Sync**: Instant data synchronization
- **Hardware Monitoring**: Terminal status and health checks
- **Offline Support**: Local data storage with sync capabilities

---

## Documentation

| Document | Description |
|----------|-------------|
| [Supabase Setup](./docs/SUPABASE_SETUP.md) | Database configuration and setup guide |
| [Database Migration](./docs/SUPABASE_MIGRATION.md) | Schema migration and data transfer guide |

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

---

## License

This project is part of **Smart India Hackathon 2025** and is licensed under the MIT License.

---

<div align="center">

### Made with care for Smart India Hackathon 2025

**[Visit Live Demo](https://digitalhajri.site) | [Report Bug](https://github.com/your-username/sih-2025/issues) | [Request Feature](https://github.com/your-username/sih-2025/issues)**

</div>
