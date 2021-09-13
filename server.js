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
const timeStamps = [];
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
	let count = 0;
	const maxNum = 3;
	const maxInterval = 10;
	const foundDiff = 100000;
	let idxFoundId = arrContains(timeStamps, id.split('*')[1], '*', 1);
	console.log(idxFoundId);
	console.log(timeStamps);
	if (idxFoundId) {
		count++;
		let foundId = idxFoundId.split('*')[0];
		let foundInterval = Date.now() - Number(foundId);

		console.log(foundId); //test
		console.log(foundInterval); //test
		// if (foundInterval < maxInterval || count > maxNum) {
		// 	console.log(count > maxNum);
		// 	console.log(!arrContains(idList, id));
		// 	console.log(idList);
		// 	console.log(foundInterval < foundDiff);
		// 	if (count > maxNum && !arrContains(idList, id) && foundInterval < foundDiff) {
		// 		idList.push(id);
		// 		console.log(idList); //test
		// 	}
		// 	return false;
		// }
	}
	timeStamps.push(`${Date.now()}*${id}`);
	return true;
}

function arrContains(arr, obj, split, splitNum, start) {
	for (var i = start || 0, j = arr.length; i < j; i++) {
		if (split) {
			if (arr[i].split(split)[splitNum] === obj) {
				console.log(arr[i].split(split)[splitNum]);
				return i;
			}
		} else {
			if (arr[i] === obj) {
				return i;
			}
		}
	}
	return false;
}

//On connection start
io.on('connection', (socket) => {
	console.log(`User ${socket.id} Connected`);
	socket.emit('user-id', socket.id);

	socket.on('check-url', (data) => {
		socket.emit('valid-url', spamCheck(data.socketId) && validURL(data.url));
	});

	socket.on('disconnect', () => {
		//Test - delete user id from arrays and all 0
		console.log(`User ${socket.id} disconnected`);
	});
});
