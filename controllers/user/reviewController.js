const Review = require('../../models/Review');
const Service = require('../../models/Service');
const Booking = require('../../models/Booking');

// @desc    Create a new review
// @route   POST /api/user/reviews
// @access  Private
exports.createReview = async (req, res) => {
    const { rating, comment, bookingId, serviceId } = req.body;
    const userId = req.user.id;

    try {
        // Check if the user has a completed booking for this service
        const booking = await Booking.findOne({
            _id: bookingId,
            customer: userId,
            status: 'Completed'
        });

        if (!booking) {
            return res.status(400).json({ msg: 'You can only review completed bookings.' });
        }

        // Check if a review already exists for this booking
        if (booking.isReviewed) {
            return res.status(400).json({ msg: 'You have already reviewed this booking.' });
        }

        // Create a new review
        const review = await Review.create({
            user: userId,
            service: serviceId,
            booking: bookingId,
            rating,
            comment
        });

        // Update the booking to mark it as reviewed
        booking.isReviewed = true;
        await booking.save();

        // Update the service with the new review
        const service = await Service.findById(serviceId);
        service.reviews.push(review._id);
        service.numberOfReviews = service.reviews.length;
        
        // Calculate the new average rating
        const reviews = await Review.find({ service: serviceId });
        const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
        service.averageRating = totalRating / reviews.length;

        await service.save();

        res.status(201).json({ success: true, data: review });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

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