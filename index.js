require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const esewaRoute = require('./routes/esewaRoute');

// --- ADD THIS ---
// Import the Google Generative AI package
const { GoogleGenerativeAI } = require('@google/generative-ai');
// --- END OF ADDITION ---


// Initialize Express app
const app = express();

// Connect to the database
connectDB();

// --- ADD THIS ---
// Initialize the Google Gemini AI model
// This uses the GEMINI_API_KEY from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// --- END OF ADDITION ---


// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---

// --- ADD THIS ---
// Gemini Chatbot Route
app.post('/api/chat', async (req, res) => {
    try {
        // Get the message from the app's request
        const { message } = req.body;

        // Send the message to the Gemini API
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        // Send the response back to the app
        res.json({ response: text });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});
// --- END OF ADDITION ---

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
app.use('/api/user/notifications', require('./routes/notificationRoute'));

// Payment Routes
app.use('/api/payment/esewa', esewaRoute);
app.use('/api/user', require('./routes/user/reviewRoute'));


// Define the port
const PORT = process.env.PORT || 5050;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});