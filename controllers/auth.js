const user = require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed.');
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}
	const email = req.body.email;
	const name = req.body.name;
	const password = req.body.password;
	try {
		hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			email: email,
			password: hashedPassword,
			name: name,
		});
		await user.save();
		res.status(201).json({ message: 'User Created', userId: user._id });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.login = async (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	try {
		const user = await User.findOne({ email: email });
		if (!user) {
			const error = new Error('A user with this e-mail do not exist.');
			error.statusCode = 404;
			throw error;
		}
		const isEqual = await bcrypt.compare(password, user.password);
		if (!isEqual) {
			const error = new Error('Wrong Password!');
			error.statusCode = 401;
			throw error;
		}
		const token = jwt.sign(
			{
				email: user.email,
				userId: user._id.toString(),
			},
			'MattGreyIsHot',
			{ expiresIn: '1h' },
		);
		res.status(200).json({ token: token, userId: user._id.toString() });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
