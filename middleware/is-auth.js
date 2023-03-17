const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	// console.log(req.get('Authorization'));
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		const error = new Error('Not authenticated. 01');
		error.statusCode = 401;
		throw error;
	}
	const token = authHeader.split(' ')[1];
	let decodedToken;
	try {
		decodedToken = jwt.verify(token, 'MattGreyIsHot');
	} catch (err) {
		err.statusCode = 500;
		throw err;
	}
	if (!decodedToken) {
		const error = new Error('Not authenticated. 02');
		error.statusCode = 401;
		throw error;
	}
	req.userId = decodedToken.userId;
	next();
};
