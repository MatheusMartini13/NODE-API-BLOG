const User = require('../models/user');
const { validationResult } = require('express-validator');

exports.getStatus = (req, res, next) => {
	User.findById(req.userId)
		.then((user) => {
			if (!user) {
				const error = new Error('User not found!');
				error.statusCode = 404;
				throw error;
			}
			res.status(200).json({ message: 'Status catched!', status: user.status });
		})
		.catch((error) => {
			if (!error.statusCode) {
				error.statusCode = 500;
			}
			next(error);
		});
};

exports.putStatus = (req, res, next) => {
	const errors = validationResult(req);
  console.log(errors)
	if (!errors.isEmpty()) {
		const error = new Error('Status should not be empty.');
		error.statusCode = 422;
		throw error;
	}
	User.findById(req.userId)
		.then((user) => {
			if (!user) {
				const error = new Error('User not found!');
				error.statusCode = 404;
				throw error;
			}
			user.status = req.body.status;
			return user.save();
		})
		.then((user) => {
			res.status(200).json({ message: 'Status sucessfully changed!' });
		})
		.catch((err) => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};
