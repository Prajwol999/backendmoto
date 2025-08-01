require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const esewaRoute = require('./routes/esewaRoute');

// Initialize Express app
const app = express();

// Connect to the database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); 

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---

// Authentication Routes
app.use('/api/auth', require('./routes/userRoute')); 

// Admin Routes
app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));

// User Dashboard Routes
app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute'));
app.use('/api/user', require('./routes/user/profileRoute'));

// --- ADD THIS ROUTE ---
app.use('/api/user/notifications', require('./routes/notificationRoute'));
// ---------------------

// Payment Routes
app.use('/api/payment/esewa', esewaRoute);

// Define the port
const PORT = process.env.PORT || 5050;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});