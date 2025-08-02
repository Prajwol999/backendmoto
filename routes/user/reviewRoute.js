const express = require('express');
const router = express.Router();
const { createReview, getServiceReviews } = require('../../controllers/user/reviewController');
const { authenticateUser } = require('../../middlewares/authorizedUser');

// @route   POST /api/user/reviews
router.post('/reviews', authenticateUser, createReview);

// @route   GET /api/user/reviews/service/:serviceId
router.get('/reviews/service/:serviceId', authenticateUser , getServiceReviews);

module.exports = router;