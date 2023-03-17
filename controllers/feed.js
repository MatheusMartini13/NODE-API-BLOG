const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

//Models
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
	//Pagination
	const currentPage = req.query.page || 1;
	const perPage = 2;
	let totalItems;
	Post.find()
		.countDocuments()
		.then((count) => {
			totalItems = count;
			//getPosts handler
			return Post.find()
				.skip((currentPage - 1) * perPage)
				.limit(perPage);
		})
		.then((posts) => {
			res.status(200).json({
				message: 'Fetched posts sucessfully',
				posts: posts,
				totalItems: totalItems,
			});
		})
		.catch((err) => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.createPost = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed.');
		error.statusCode = 422;
		throw error;
	}
	if (!req.file) {
		const error = new Error('No image provided!');
		error.statusCode = 422;
		throw error;
	}
	const imageUrl = req.file.path.replace('\\', '/');
	const title = req.body.title;
	const content = req.body.content;
	let creator;
	const post = new Post({
		title: title,
		content: content,
		imageUrl: imageUrl,
		creator: req.userId,
	});
	post
		.save()
		.then(() => {
			return User.findById(req.userId);
		})
		.then((user) => {
			creator = user;
			user.posts.push(post);
			return user.save();
		})
		.then((user) => {
			res.status(201).json({
				message: 'Post created successfully!',
				post: post,
				creator: { _id: creator._id, name: creator.name },
			});
		})
		.catch((err) => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.getPost = (req, res, next) => {
	const postId = req.params.postId;
	Post.findById(postId)
		.then((post) => {
			if (!post) {
				const error = new Error('No post found.');
				error.statusCode = 404;
				throw error;
			}
			return res.status(200).json({ message: 'Post fetched!', post: post });
		})
		.catch((err) => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.updatePost = (req, res, next) => {
	const postId = req.params.postId;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed.');
		error.statusCode = 422;
		throw error;
	}
	const title = req.body.title;
	const content = req.body.content;
	let imageUrl = req.body.image;
	if (req.file) {
		imageUrl = req.file.path.replace('\\', '/');
	}
	if (!imageUrl) {
		const error = new Error('No file found.');
		error.statusCode = 422;
		throw error;
	}
	Post.findById(postId)
		.then((post) => {
			if (!post) {
				const error = new Error('No post found.');
				error.statusCode = 404;
				throw error;
			}
			if (post.creator.toString() !== req.userId) {
				const error = new Error('Not authorized');
				error.statusCode = 403;
				throw error;
			}
			if (imageUrl !== post.imageUrl) {
				clearImage(post.imageUrl);
			}
			post.title = title;
			post.content = content;
			post.imageUrl = imageUrl;
			return post.save();
		})
		.then((result) => {
			return res.status(200).json({ message: 'Post updated', post: result });
		})
		.catch((err) => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.deletePost = (req, res, next) => {
	const postId = req.params.postId;
	Post.findById(postId)
		.then((post) => {
			if (!post) {
				const error = new Error('Post not found.');
				error.statusCode = 404;
				throw error;
			}
			if (post.creator.toString() !== req.userId) {
				const error = new Error('Not Authorized!');
				error.statusCode = 403;
				throw error;
			}
			//Check User;
			clearImage(post.imageUrl);
			return Post.findByIdAndRemove(postId);
		})
		.then(() => {
			return User.findById(req.userId);
		})
		.then((user) => {
			user.posts.pull(postId);
			return user.save();
		})
		.then(() => {
			res.status(200).json({ message: 'Deleted Post' });
		})
		.catch((error) => {
			if (!error.statusCode) {
				error.statusCode = 500;
			}
			next(error);
		});
};

const clearImage = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, (err) => err ? console.log(err) : undefined);
};
