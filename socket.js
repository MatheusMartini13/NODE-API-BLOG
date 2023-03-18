const {Server} = require('socket.io')

let io;

module.exports = {
	init: (httpServer) => {
		io = require('socket.io')(httpServer, {} = {
			cors: {
				origin: '*',
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
			}});
		return io;
	},
	getIo: () => {
		if (!io) {
			throw new Error('Socket.io not initialized!');
		}
		return io;
	},
};
