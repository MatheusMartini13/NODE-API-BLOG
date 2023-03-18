const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const io = require('../socket');

//Models
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
	//Pagination
	const currentPage = req.query.page || 1;
	const perPage = 2;
	try {
		const totalItems = await Post.find().countDocuments();
		let posts = await Post.find()
			.populate('creator')
			.sort({ createdAt: -1 })
			.skip((currentPage - 1) * perPage)
			.limit(perPage);
		res.status(200).json({
			message: 'Fetched posts sucessfully',
			posts: posts,
			totalItems: totalItems,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.createPost = async (req, res, next) => {
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
	try {
		await post.save();
		const user = await User.findById(req.userId);
		creator = user;
		user.posts.push(post);
		await user.save();
		io.getIo().emit('posts', {
			action: 'create',
			post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
		});
		res.status(201).json({
			message: 'Post created successfully!',
			post: post,
			creator: { _id: creator._id, name: creator.name },
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getPost = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId).populate('creator');
		if (!post) {
			const error = new Error('No post found.');
			error.statusCode = 404;
			throw error;
		}
		res.status(200).json({ message: 'Post fetched!', post: post });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.updatePost = async (req, res, next) => {
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
	try {
		const post = await Post.findById(postId).populate('creator');
		if (!post) {
			const error = new Error('No post found.');
			error.statusCode = 404;
			throw error;
		}
		if (post.creator._id.toString() !== req.userId) {
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
		const savedPost = await post.save();
		io.getIo().emit('posts', { action: 'update', post: savedPost });
		res.status(200).json({ message: 'Post updated', post: savedPost });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.deletePost = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
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
		await Post.findByIdAndRemove(postId);
		const user = await User.findById(req.userId);
		user.posts.pull(postId);
		await user.save();
		io.getIo().emit('posts', { action: 'delete', post: postId });
		res.status(200).json({ message: 'Deleted Post' });
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500;
		}
		next(error);
	}
};

const clearImage = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, (err) => (err ? console.log(err) : undefined));
};
