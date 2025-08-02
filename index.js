require('dotenv').config();

const express = require('express');
const cors = require('cors');
// Correct code
const path = require('path');
const connectDB = require('./config/db');
const esewaRoute = require('./routes/esewaRoute');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios'); // Required for making internal API calls

// Initialize Express app and connect to DB
const app = express();
connectDB();

// Initialize the Google Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 1. DEFINE THE TOOL ---
// This function allows the AI to get a list of available services
// by calling your own backend's service endpoint.
const getAvailableServices = async () => {
  try {
    const response = await axios.get('http://localhost:5050/api/user/services');
    if (response.data && response.data.success) {
      // We only return the names of the services to the AI
      const serviceNames = response.data.data.map(service => service.name);
      return { services: serviceNames };
    }
    return { error: "Could not fetch the list of services." };
  } catch (error) {
    console.error("Error fetching services for AI tool:", error.message);
    return { error: "An internal error occurred while fetching services." };
  }
};

// --- 2. CONFIGURE THE TOOL FOR GEMINI ---
// Describe the tool so the AI knows when and how to use it.
const tools = [
  {
    functionDeclarations: [
      {
        name: 'getAvailableServices',
        description: 'Get the list of all available repair and maintenance services offered by MotoFix.',
        parameters: { type: 'object', properties: {} }, // This function needs no input
      },
    ],
  },
];

// --- 3. ATTACH THE TOOL TO THE MODEL ---
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  tools: tools, // This makes the model aware of the tool
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. UPDATE THE CHAT ROUTE ---
// This new route handles both simple questions and tool-calling.
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const chat = model.startChat();
        const result = await chat.sendMessage(message);
        const response = result.response;

        // Check if the model decided to call our function
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];

            // If the AI wants to get the services, execute our local function
            if (call.name === 'getAvailableServices') {
                const functionResult = await getAvailableServices();

                // Send the function's result back to the AI
                const result2 = await chat.sendMessage([
                    { functionResponse: { name: 'getAvailableServices', response: functionResult } }
                ]);

                // Get the AI's final, natural-language response and send it to the app
                const finalResponse = result2.response.text();
                return res.json({ response: finalResponse });
            }
        }

        // If no function was called, just return the AI's direct text response
        const text = response.text();
        res.json({ response: text });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

// --- Your other API Routes ---
app.use('/api/auth', require('./routes/userRoute'));
app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));
app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute'));
app.use('/api/user', require('./routes/user/profileRoute'));
app.use('/api/user/notifications', require('./routes/notificationRoute'));
app.use('/api/payment/esewa', esewaRoute);
app.use('/api/user', require('./routes/user/reviewRoute'));

// Define the port and start the server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});