const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const hospitalRoutes = require('./routes/hospitalRoutes');
const { router: cityRoutes } = require('./routes/cityRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const outbreakRoutes = require('./routes/outbreakRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const { router: patientRoutes, setIO: setPatientIO } = require('./routes/patientRoutes');
const Hospital = require('./models/Hospital');
const Ambulance = require('./models/Ambulance');
const EmergencyAlert = require('./models/EmergencyAlert');
const { setupChangeStreams, initializeSocketRooms, getInitialCitySummary } = require('./services/changeStreamService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Set WebSocket instance for emergency routes (after io is created)
emergencyRoutes.setIO(io);
setPatientIO(io);

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hospital_user:Zd35eWE4go0KiEAZ@cluster0.ezc39kq.mongodb.net/hospital-sync?retryWrites=true&w=majority&appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());

// Global request logger
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Inventory Alert Functions
function checkExpiryDates() {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  Hospital.find({})
    .then(hospitals => {
      hospitals.forEach(hospital => {
        if (hospital.inventory) {
          hospital.inventory.forEach(item => {
            if (item.expiryDate && new Date(item.expiryDate) <= sevenDaysFromNow) {
              io.emit('inventory_alert', {
                hospitalName: hospital.name,
                itemName: item.name,
                stock: item.stock,
                expiryDate: item.expiryDate,
                daysUntilExpiry: Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
              });
              console.log(`🚨 Expiry Alert: ${item.name} at ${hospital.name} expires in ${Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days`);
            }
          });
        }
      });
    })
    .catch(err => console.error('Error checking expiry dates:', err));
}

function checkLowStock() {
  Hospital.find({})
    .then(hospitals => {
      hospitals.forEach(hospital => {
        if (hospital.inventory) {
          hospital.inventory.forEach(item => {
            if (item.stock < 10) {
              io.emit('low_stock_alert', {
                hospitalName: hospital.name,
                itemName: item.name,
                stock: item.stock,
                unit: item.unit
              });
              console.log(`⚠️ Low Stock Alert: ${item.name} at ${hospital.name} - only ${item.stock} ${item.unit} remaining`);
            }
          });
        }
      });
    })
    .catch(err => console.error('Error checking low stock:', err));
}

// Run inventory checks every 5 minutes
setInterval(() => {
  console.log('🔍 Running inventory checks...');
  checkExpiryDates();
  checkLowStock();
}, 5 * 60 * 1000); // 5 minutes

// Run initial check after 10 seconds
setTimeout(() => {
  console.log('🚀 Starting initial inventory checks...');
  checkExpiryDates();
  checkLowStock();
}, 10000);

// Socket.io connection with real-time updates
io.on('connection', async (socket) => {
  initializeSocketRooms(socket);
  
  // Send initial data to new connections
  try {
    const initialSummary = await getInitialCitySummary();
    socket.emit('city_update', initialSummary);
    console.log('📊 Sent initial city summary to new connection');
    
    // Send initial wastage summary (if function exists)
    try {
      const { getCityWastageSummary } = require('./services/changeStreamService');
      const initialWastageSummary = await getCityWastageSummary();
      socket.emit('city_wastage_update', initialWastageSummary);
      console.log('💊 Sent initial wastage summary to new connection');
    } catch (err) {
      // Function might not exist, skip
    }
    
    // Send initial outbreak summary (if function exists)
    try {
      const { getOutbreakSummary } = require('./services/changeStreamService');
      const initialOutbreakSummary = await getOutbreakSummary();
      socket.emit('outbreak_update', initialOutbreakSummary);
      console.log('🦠 Sent initial outbreak summary to new connection');
    } catch (err) {
      // Function might not exist, skip
    }
  } catch (error) {
    console.error('Error sending initial data:', error);
  }

  // Emergency response WebSocket handlers
  socket.on('subscribe_emergency', async (alertId) => {
    socket.join(`emergency_${alertId}`);
    console.log(`📡 Client subscribed to emergency updates: ${alertId}`);
    
    // Send current state if available
    try {
      const alert = await EmergencyAlert.findOne({ alertId });
      if (alert && alert.assignedAmbulanceId) {
        const ambulance = await Ambulance.findOne({ id: alert.assignedAmbulanceId });
        if (ambulance) {
          socket.emit('ambulance_location_update', {
            alertId,
            ambulance: {
              id: ambulance.id,
              unitNumber: ambulance.unitNumber,
              latitude: ambulance.latitude,
              longitude: ambulance.longitude,
              status: ambulance.status
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending initial emergency state:', error);
    }
  });

  socket.on('unsubscribe_emergency', (alertId) => {
    socket.leave(`emergency_${alertId}`);
    console.log(`📡 Client unsubscribed from emergency updates: ${alertId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected from emergency system');
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'City Health Sync API is running' });
});

// Hospital routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/outbreaks', outbreakRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/patients', patientRoutes);

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Setup change streams after MongoDB connection is established
  mongoose.connection.once('connected', async () => {
    try {
      console.log('✅ MongoDB connection established, setting up change streams...');
      await setupChangeStreams(io, mongoose);
    } catch (error) {
      console.error('Error setting up change streams:', error);
    }
  });
  
  // Also try to setup if already connected
  if (mongoose.connection.readyState === 1) {
    try {
      await setupChangeStreams(io, mongoose);
    } catch (error) {
      console.error('Error setting up change streams:', error);
    }
  }
});
