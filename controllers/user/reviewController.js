const Review = require('../../models/Review');
const Service = require('../../models/Service');
const Booking = require('../../models/Booking');

// @desc    Create a new review
// @route   POST /api/user/reviews
// @access  Private
// exports.createReview = async (req, res) => {
//     const { rating, comment, bookingId, serviceId } = req.body;
//     const userId = req.user.id;

//     try {
//         // Check if the user has a completed booking for this service
//         const booking = await Booking.findOne({
//             _id: bookingId,
//             customer: userId,
//             status: 'Completed'
//         });

//         if (!booking) {
//             return res.status(400).json({ msg: 'You can only review completed bookings.' });
//         }

//         // Check if a review already exists for this booking
//         if (booking.isReviewed) {
//             return res.status(400).json({ msg: 'You have already reviewed this booking.' });
//         }

//         // Create a new review
//         const review = await Review.create({
//             user: userId,
//             service: serviceId,
//             booking: bookingId,
//             rating,
//             comment
//         });

//         // Update the booking to mark it as reviewed
//         booking.isReviewed = true;
//         await booking.save();

//         // Update the service with the new review
//         const service = await Service.findById(serviceId);
//         service.reviews.push(review._id);
//         service.numberOfReviews = service.reviews.length;
        
//         // Calculate the new average rating
//         const reviews = await Review.find({ service: serviceId });
//         const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
//         service.averageRating = totalRating / reviews.length;

//         await service.save();

//         res.status(201).json({ success: true, data: review });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// };


// @desc    Create a new review for a completed booking
// @route   POST /api/user/reviews
// @access  Private
exports.createReview = async (req, res) => {
    const { rating, comment, bookingId } = req.body;
    const userId = req.user.id;

    if (!rating || !comment || !bookingId) {
        return res.status(400).json({ success: false, message: 'Please provide rating, comment, and bookingId.' });
    }

    try {
        const booking = await Booking.findById(bookingId);

        // 1. Validation: Check if booking exists
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        // 2. Validation: Check ownership and status
        if (booking.customer.toString() !== userId) {
            return res.status(401).json({ success: false, message: 'You are not authorized to review this booking.' });
        }
        if (booking.status !== 'Completed') {
            return res.status(400).json({ success: false, message: 'You can only review completed bookings.' });
        }

        // 3. Validation: Check if already reviewed
        if (booking.isReviewed) {
            return res.status(400).json({ success: false, message: 'You have already submitted a review for this booking.' });
        }
        
        // Find the service associated with the booking to link in the review
        const service = await Service.findOne({ name: booking.serviceType });
        if (!service) {
             return res.status(404).json({ success: false, message: 'The service associated with this booking could not be found.' });
        }

        // 4. Create the new review
        const review = await Review.create({
            user: userId,
            service: service._id, // Link to the service ID
            booking: bookingId,
            rating,
            comment
        });

        // 5. Update booking to mark as reviewed
        booking.isReviewed = true;
        await booking.save();

        // 6. Update the corresponding service's review stats
        const reviews = await Review.find({ service: service._id });
        const numberOfReviews = reviews.length;
        const averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numberOfReviews;
        
        service.reviews.push(review._id);
        service.numberOfReviews = numberOfReviews;
        service.averageRating = averageRating.toFixed(1); // Keep one decimal place

        await service.save();

        res.status(201).json({ success: true, message: "Thank you for your review!", data: review });
    } catch (err) {
        console.error(err.message);
        // Handle potential duplicate key error if the unique index on 'booking' is violated
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'A review for this booking has already been submitted.' });
        }
        res.status(500).send('Server Error');
    }
};

// ... (getServiceReviews function remains the same)
// @desc    Get all reviews for a service
// @route   GET /api/user/reviews/service/:serviceId
// @access  Public
exports.getServiceReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ service: req.params.serviceId }).populate('user', 'fullName profilePicture');
        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};