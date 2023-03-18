//Node Modules
const path = require('path');

//Tests
const { createServer } = require('http');
const { Server } = require('socket.io');

//3rd Party Modules
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

//Routes
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const statusRoutes = require('./routes/status');

//app
const app = express();

//configurations
const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(
			null,
			new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname,
		);
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

//middlewares

app.use(express.json());
app.use(
	multer({
		storage: fileStorage,
		fileFilter: fileFilter,
	}).single('image'),
);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, PATCH',
	);
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

//Routes
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use(statusRoutes);

//error handlers
app.use((error, req, res, next) => {
	console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({ message: message, data: data });
});

mongoose
	.connect(
		'mongodb+srv://matt:x03261107@cluster0.0ofd72s.mongodb.net/messages?',
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
		},
	)
	.then(() => {
		const server = app.listen(8080);
		const io = require('./socket').init(server, {
			cors: {
				origin: '*',
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
			},
		});

		io.on('connection', (socket) => {
			console.log('Client connected!');
		});
	})
	.catch((err) => console.log(err));
