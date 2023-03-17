const express = require('express');

const { body } = require('express-validator');
const router = express.Router();

const User = require('../models/user');
const authController = require('../controllers/auth')

router.put('/signup', [
	body('name')
		.trim()
		.isLength({ min: 2 })
		.withMessage('Please enter a valid name.'),
	body('password')
		.trim()
		.isLength({ min: 8 })
		.withMessage('Please enter a valid password.'),
	body('email')
		.isEmail()
		.normalizeEmail()
		.withMessage('Please enter a valid email.')
		.custom((value, { req }) => {
			return User.findOne({ email: value }).then((userDoc) => {
				if (userDoc) {
					return Promise.reject('User already registered with this email.');
				}
			});
		}),
], authController.signup);

router.post('/login', authController.login)

module.exports = router;
