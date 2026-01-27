# Starting the Backend Server

## Quick Start

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   node server.js
   ```

   You should see:
   ```
   Connected to MongoDB Atlas
   Server is running on port 5000
   ```

## Troubleshooting

### Connection Refused Error

If you see `ERR_CONNECTION_REFUSED`:
- Make sure the backend server is running on port 5000
- Check if another process is using port 5000
- Verify MongoDB connection is working

### Port Already in Use

If port 5000 is already in use:
- Change PORT in server.js or use environment variable:
  ```bash
  PORT=5001 node server.js
  ```
- Update frontend API_URL to match

### MongoDB Connection Issues

- Verify MONGODB_URI in server.js is correct
- Check internet connection
- Verify MongoDB Atlas allows connections from your IP

## Testing the Server

Once running, test with:
```bash
curl http://localhost:5000/
```

Should return:
```json
{"message":"City Health Sync API is running"}
```

Test emergency endpoint (after seeding ambulances):
```bash
curl -X POST http://localhost:5000/api/emergency \
  -H "Content-Type: application/json" \
  -d '{"latitude": 19.0760, "longitude": 72.8777}'
```

## Required Dependencies

Make sure these are installed:
- express
- mongoose
- cors
- socket.io
- http

If missing, run:
```bash
npm install express mongoose cors socket.io
```
