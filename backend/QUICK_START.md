# Quick Start Guide

## ✅ Connection String Updated!

Your MongoDB Atlas connection string has been updated in:
- `backend/server.js` (line 30)
- `backend/seedAmbulances.js`

## Next Steps

### 1. Make sure your IP is whitelisted in MongoDB Atlas
- Go to MongoDB Atlas Dashboard → Network Access
- Add your current IP address (or `0.0.0.0/0` for testing)

### 2. Start the backend server
```bash
cd backend
node server.js
```

You should see:
```
Connected to MongoDB Atlas
Server is running on port 5000
```

### 3. Seed ambulance data (in a new terminal)
```bash
cd backend
node seedAmbulances.js
```

You should see:
```
✅ Connected to MongoDB Atlas
🗑️  Cleared existing ambulance data
🚑 Successfully seeded 10 ambulances!
```

### 4. Test the Emergency System

1. **Start the frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open your browser** to `http://localhost:8080`

3. **Click the Emergency button** on the homepage

4. **Allow location access** when prompted

5. **View the emergency panel** with live map!

## Troubleshooting

### Connection Refused
- Make sure backend server is running (`node backend/server.js`)
- Check that MongoDB Atlas IP whitelist includes your IP
- Verify connection string in `backend/server.js`

### No Ambulances Found
- Run `node backend/seedAmbulances.js` to create test data
- Verify data was seeded: Check MongoDB Atlas dashboard → Collections

### WebSocket Connection Issues
- Make sure both frontend and backend are running
- Check browser console for connection errors
- Verify CORS settings in `backend/server.js`

## Success Indicators

✅ Server logs: "Connected to MongoDB Atlas"  
✅ Ambulance seed: "Successfully seeded X ambulances"  
✅ Emergency button: Opens panel with map  
✅ Map shows: Victim location + Ambulance location + Route  

## Your Connection String

```
mongodb+srv://hospital_user:****@cluster0.ezc39kq.mongodb.net/hospital-sync
```

**Database Name**: `hospital-sync`  
**Cluster**: `cluster0.ezc39kq`  

Happy coding! 🚑
