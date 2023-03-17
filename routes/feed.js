//3rd party modules
const express = require('express');
const { body } = require('express-validator');

//middlewares
const isAuth = require('../middleware/is-auth');

const router = express.Router();

//Controllers
const feedController = require('../controllers/feed');

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);
router.get('/post/:postId', isAuth, feedController.getPost);

// POST /feed/post
router.post(
	'/post',
	[
		body('title').trim().isLength({ min: 5 }),
		body('content').trim().isLength({ min: 5 }),
	],
	isAuth,
	feedController.createPost,
);

// PUT /feed/post
router.put(
	'/post/:postId',
	[
		body('title').trim().isLength({ min: 5 }),
		body('content').trim().isLength({ min: 5 }),
	],
	isAuth,
	feedController.updatePost,
);

//DELETE /feed/post

router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;
