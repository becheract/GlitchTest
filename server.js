const { time } = require('console');
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
let timeStamps = [];
let idList = [];

app.use('/static', express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(process.env.PORT || 8080, () => console.log('Server started'));

function validURL(str) {
	var pattern = new RegExp(
		'^(https?:\\/\\/)?' + // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
			'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
			'(\\#[-a-z\\d_]*)?$',
		'i'
	); // fragment locator
	return !!pattern.test(str);
}

function spamCheck(id) {
	const maxInterval = 100;
	let foundId = arrContains(timeStamps, id, '*', 1);
	if (foundId) {
		let foundInterval = Date.now() - Number(timeStamps[foundId].split('*')[0]);
		if (foundInterval < maxInterval) {
			return false;
		}
	}
	timeStamps.push(`${Date.now()}*${id}`);
	return true;
}

function arrContains(arr, obj, split, splitNum, del, start) {
	let found = false;
	if (arr.length > 0) {
		if (split) {
			for (var i = start || 0, j = arr.length; i < j; i++) {
				if (arr[i].split(split)[splitNum] === obj) {
					found = i;
					if (del) arr.splice(i, 1);
				}
			}
		} else {
			for (var i = start || 0, j = arr.length; i < j; i++) {
				if (arr[i] === obj) {
					return i;
				}
			}
		}
	}

	return found;
}

function arrClear(arr, obj, split, splitNum, start) {
	if (arr.length > 0) {
		if (split) {
			for (var i = start || 0, j = arr.length; i < j; i++) {
				if (arr[i].split(split)[splitNum] === obj) {
					arr.splice(i, 1);
					i--;
					j--;
				}
			}
		} else {
			for (var i = start || 0, j = arr.length; i < j; i++) {
				if (arr[i] === obj) {
					arr.splice(i, 1);
					i--;
					j--;
				}
			}
		}
	}

	return arr;
}

//On connection start
io.on('connection', (socket) => {
	console.log(`User ${socket.id} Connected`);
	socket.emit('user-id', socket.id);

	socket.on('check-url', (data) => {
		let test = spamCheck(data.socketId) && validURL(data.url);
		socket.emit('valid-url', test);
	});

	socket.on('disconnect', () => {
		timeStamps = arrClear(timeStamps, socket.id, '*', 1);
		console.log(`User ${socket.id} disconnected`);
	});
});
