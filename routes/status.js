const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const statusController = require('../controllers/status');
const isAuth = require('../middleware/is-auth');

//GET /STATUS
router.get('/status', isAuth, statusController.getStatus);

//PUT/STATUS
router.put(
	'/status',
	isAuth,
	[body('status').trim().isLength({ min: 5 })],
	statusController.putStatus,
);

module.exports = router;
