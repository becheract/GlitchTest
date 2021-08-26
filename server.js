const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
	cors: {
		origin: '*',
		// methods: ['GET', 'POST'],
	},
});
const path = require('path');
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

app.use('/static', express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(process.env.PORT || 8080, () => console.log('Server started'));

io.on('connect', (socket) => {
	console.log('User connected: ' + socket.id);
});
