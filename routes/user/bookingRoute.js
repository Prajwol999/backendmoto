const express = require('express');
const router = express.Router();

const { 
    getUserBookings, 
    createBooking, 
    updateUserBooking, 
    deleteUserBooking, 
    confirmPayment,
    verifyKhaltiPayment ,
    getBookingById ,
    getUserCompletedBookings
   
} = require('../../controllers/user/bookingController');
const { authenticateUser } = require('../../middlewares/authorizedUser');

router.route('/bookings')
    .get(authenticateUser, getUserBookings)
    .post(authenticateUser, createBooking);

router.route('/bookings/:id')
    .put(authenticateUser, updateUserBooking)
    .delete(authenticateUser, deleteUserBooking);

router.route('/bookings/:id/pay')
    .put(authenticateUser, confirmPayment);

router.route('/bookings/verify-khalti')
    .post(authenticateUser, verifyKhaltiPayment);

router.route('/bookings/:id').get(authenticateUser , getBookingById)
router.route('/booking/completed').get(authenticateUser ,getUserCompletedBookings )

module.exports = router;