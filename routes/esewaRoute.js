// import express from 'express';
// import { initiateEsewaPayment, verifyEsewaPayment } from '../controllers/esewaController.js';

// const router = express.Router();

// router.post('/initiate', initiateEsewaPayment);
// router.get('/verify', verifyEsewaPayment);

const express = require('express');
const { initiateEsewaPayment, verifyEsewaPayment  , initiateEsewaPaymentApp} = require('../controllers/esewaController');

const router = express.Router();

router.post('/initiate', initiateEsewaPayment);
router.get('/verify', verifyEsewaPayment);
router.get('/intiate-app' ,initiateEsewaPaymentApp)

module.exports = router;
