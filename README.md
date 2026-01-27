# 🏥 MediSync - Hospital Management System

A comprehensive, real-time hospital management system built with modern web technologies and Firebase integration. MediSync streamlines hospital operations with intelligent patient flow management, real-time bed tracking, blood bank management, and much more.

## ✨ Features

### 🎯 Core Hospital Operations
- **Real-time Dashboard** - Live hospital statistics and metrics
- **OPD Queue Management** - Smart patient token system with queue tracking
- **Bed Status Tracking** - Real-time bed availability and occupancy monitoring
- **Blood Bank Management** - Inventory tracking and donation management
- **Patient Admissions** - Streamlined admission process with real-time updates
- **Medical Inventory** - Comprehensive medical supplies management

### 👥 Multi-Role Access
- **Admin Dashboard** - Complete system oversight and management
- **Doctor Dashboard** - Patient management and clinical tools
- **Nurse Dashboard** - Ward management and patient care
- **Patient Portal** - Appointments, records, and personal health tracking

### 🚀 Advanced Features
- **Smart OPD System** - Intelligent patient flow optimization
- **Hospital Network** - Multi-hospital coordination
- **Real-time Analytics** - Data-driven insights and reporting
- **Emergency Response** - Ambulance detection and outbreak monitoring
- **Resource Management** - Predictive resource allocation
- **City-wide Heatmaps** - Regional healthcare demand visualization

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast development and build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form management
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend & Database
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Firebase** - Real-time database and authentication
- **MongoDB** - Document database (with Mongoose)
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Development Tools
- **ESLint** - Code linting
- **Vitest** - Unit testing
- **PostCSS** - CSS processing
- **TypeScript** - Static typing

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase project (for database and auth)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MediSync
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   cd frontend
   npm install
   
   # Backend dependencies
   cd ../backend
   npm install
   ```

3. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Realtime Database
   - Create a `.env` file in `frontend/` with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=your_database_url
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Backend: http://localhost:5000

## 📁 Project Structure

```
MediSync/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utility functions
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # Node.js backend API
│   ├── server.js            # Main server file
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   └── package.json
├── scripts/                 # Utility scripts
├── supabase/               # Database schemas (if using Supabase)
└── README.md
```

## 🔧 Configuration

### Firebase Database Structure

The system uses Firebase Realtime Database with the following structure:

```
{
  "patients": {
    "patientId": {
      "personalInfo": { ... },
      "medicalHistory": { ... },
      "appointments": { ... }
    }
  },
  "opdQueue": {
    "tokens": [
      {
        "tokenNumber": "A101",
        "patientId": "patient123",
        "status": "waiting",
        "department": "General Medicine"
      }
    ]
  },
  "beds": {
    "bedId": {
      "status": "occupied",
      "patientId": "patient123",
      "ward": "ICU",
      "bedNumber": "A-101"
    }
  },
  "bloodBank": {
    "inventory": {
      "A+": { "units": 25, "lastUpdated": "2024-01-01" },
      "O-": { "units": 15, "lastUpdated": "2024-01-01" }
    },
    "donations": [ ... ]
  },
  "admissions": [ ... ],
  "inventory": {
    "items": [ ... ]
  },
  "users": [ ... ],
  "dashboard": {
    "stats": { ... }
  }
}
```

## 🎯 Key Features in Detail

### 1. Smart OPD System
- Token-based patient queue management
- Real-time queue status updates
- Department-wise queue organization
- Estimated wait time calculations
- SMS notifications for patients

### 2. Real-time Bed Management
- Live bed availability tracking
- Ward-wise bed organization
- Patient assignment and transfer
- Cleaning and maintenance status
- Bed utilization analytics

### 3. Blood Bank Management
- Real-time blood inventory tracking
- Donation camp management
- Blood request and fulfillment
- Expiry date monitoring
- Emergency blood allocation

### 4. Patient Portal
- Online appointment booking
- Medical record access
- Prescription viewing
- Lab results
- Payment history

### 5. Analytics Dashboard
- Hospital performance metrics
- Patient flow analysis
- Resource utilization
- Financial analytics
- Custom reporting

## 🔐 Authentication & Security

- **Firebase Authentication** for secure user management
- **Role-based access control** (Admin, Doctor, Nurse, Patient)
- **JWT tokens** for API authentication
- **Password hashing** with bcryptjs
- **CORS protection** for API security
- **Input validation** and sanitization

## 📱 Responsive Design

- **Mobile-first** approach
- **Responsive layouts** for all screen sizes
- **Touch-friendly** interfaces
- **Progressive Web App** capabilities
- **Offline support** for critical features

## 🔄 Real-time Features

- **Live updates** using Firebase listeners
- **Socket.io** for instant notifications
- **Real-time collaboration** between staff
- **Instant status changes** across all devices
- **Emergency alerts** and notifications

## 🧪 Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run tests in watch mode
npm run test:watch

# Run backend tests
cd backend
npm test
```

## 📦 Build & Deployment

### Frontend Build
```bash
cd frontend
npm run build
```

### Production Deployment
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository 
- Join our community discussions

## 🗺 Roadmap

### Upcoming Features
- [ ] Telemedicine integration
- [ ] AI-powered diagnosis assistance
- [ ] Mobile app (React Native)
- [ ] Advanced analytics with ML
- [ ] Integration with medical devices
- [ ] Multi-language support
- [ ] Voice commands for hands-free operation

### Version History
- **v2.0.0** - Firebase integration, real-time features
- **v1.5.0** - Smart OPD system, patient portal
- **v1.0.0** - Initial release with core hospital management

---

**Built with ❤️ for healthcare professionals**
