const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const User = require('../../models/User');
const Notification = require('../../models/Notification'); // <-- ADD THIS LINE
const axios = require('axios'); 

/**
 * @desc    Get all bookings for the logged-in user, sorted by most recent
 * @route   GET /api/user/bookings
 * @access  Private
 */
const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Create a new booking, which will have a pending payment status
 * @route   POST /api/user/bookings
 * @access  Private
 */
const createBooking = async (req, res) => {
    const { serviceId, bikeModel, date, notes } = req.body;

    if (!serviceId || !bikeModel || !date) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    try {
        const user = await User.findById(req.user.id);
        const service = await Service.findById(serviceId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found.' });
        }

        const booking = new Booking({
            customer: user._id,
            customerName: user.fullName,
            serviceType: service.name,
            bikeModel,
            date,
            notes,
            totalCost: service.price,
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false
        });

        await booking.save();

        // --- NOTIFICATION LOGIC ---
        await new Notification({
            userId: user._id,
            message: `Your booking for '${service.name}' has been created. Please complete the payment.`
        }).save();
        // --- END NOTIFICATION LOGIC ---

        res.status(201).json({ success: true, data: booking, message: "Booking created. Please complete payment." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update a booking made by the user
 * @route   PUT /api/user/bookings/:id
 * @access  Private
 */
const updateUserBooking = async (req, res) => {
    try {
        const { serviceId, bikeModel, date, notes } = req.body;
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.customer.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }

        if (booking.status !== 'Pending') {
            return res.status(400).json({ success: false, message: `Cannot edit a booking with status "${booking.status}"` });
        }

        if (serviceId) {
            const service = await Service.findById(serviceId);
            if (!service) {
                return res.status(404).json({ success: false, message: 'New service not found.' });
            }
            booking.serviceType = service.name;
            booking.totalCost = service.price;
        }

        booking.bikeModel = bikeModel || booking.bikeModel;
        booking.date = date || booking.date;
        booking.notes = notes || booking.notes;

        await booking.save();
        res.json({ success: true, data: booking, message: 'Booking updated successfully' });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Server error while updating booking.' });
    }
};

/**
 * @desc    Delete a booking made by the user
 * @route   DELETE /api/user/bookings/:id
 * @access  Private
 */
const deleteUserBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.customer.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }
        
        if (booking.isPaid) {
            return res.status(400).json({ success: false, message: `Cannot delete a booking that has been paid for.` });
        }

        await booking.deleteOne();
        res.json({ success: true, message: 'Booking deleted successfully.' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Confirm a booking payment via COD
 * @route   PUT /api/user/bookings/:id/pay
 * @access  Private
 */
const confirmPayment = async (req, res) => {
    const { paymentMethod } = req.body;

    if (paymentMethod !== 'COD') {
        return res.status(400).json({ success: false, message: 'This route is only for COD payments.' });
    }

    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        if (booking.customer.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this booking.' });
        }

        booking.paymentMethod = 'COD';
        booking.paymentStatus = 'Paid';
        booking.isPaid = true;

        await booking.save();

        // --- NOTIFICATION LOGIC ---
        await new Notification({
            userId: booking.customer,
            message: `Payment confirmed for booking of '${booking.serviceType}'. Our team will contact you shortly.`
        }).save();
        // --- END NOTIFICATION LOGIC ---

        res.status(200).json({ success: true, data: booking, message: "Payment confirmed successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Verify a Khalti payment (LIVE IMPLEMENTATION)
 * @route   POST /api/user/bookings/verify-khalti
 * @access  Private
 */
const verifyKhaltiPayment = async (req, res) => {
    const { token, amount, booking_id } = req.body;

    if (!token || !amount || !booking_id) {
        return res.status(400).json({ success: false, message: 'Missing payment verification details.' });
    }

    try {
        const verificationData = {
            token: token,
            amount: amount,
        };

        const khaltiResponse = await axios.post(
            'https://khalti.com/api/v2/payment/verify/',
            verificationData,
            {
                headers: {
                    'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`
                }
            }
        );

        if (khaltiResponse.data && khaltiResponse.data.idx) {
            const booking = await Booking.findById(booking_id);
            if (!booking) {
                return res.status(404).json({ success: false, message: 'Booking not found after payment.' });
            }

            booking.paymentMethod = 'Khalti';
            booking.paymentStatus = 'Paid';
            booking.isPaid = true;
            
            await booking.save();

            // --- NOTIFICATION LOGIC ---
            await new Notification({
                userId: booking.customer,
                message: `Payment of Rs. ${booking.totalCost} via Khalti was successful for your booking of '${booking.serviceType}'.`
            }).save();
            // --- END NOTIFICATION LOGIC ---

            return res.status(200).json({ success: true, message: "Payment successful and booking updated." });
        } else {
            return res.status(400).json({ success: false, message: 'Khalti payment verification failed.' });
        }
    } catch (error) {
        console.error('Khalti verification error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'Server error during Khalti verification.' });
    }
};

const getUserCompletedBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            customer: req.user.id,
            status: 'Completed' 
        }).sort({ date: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc     Get a single booking by its ID
 * @route    GET /api/user/bookings/:id
 * @access   Private
 */
const getBookingById = async (req, res) => {
    try {
        // Corrected line: Removed .populate('service')
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Ensure the booking belongs to the user requesting it
        if (booking.customer.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }

        // The 'booking' object will now be sent with the data as it is in the database
        res.json({ success: true, data: booking });

    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching booking.' });
    }
};



module.exports = {
    getUserBookings,
    createBooking,
    updateUserBooking,
    deleteUserBooking,
    confirmPayment,
    verifyKhaltiPayment ,
getBookingById ,
getUserCompletedBookings
};