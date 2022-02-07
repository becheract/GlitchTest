const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

const crypto = require('crypto');
const { execSync } = require('child_process');

let timeStamps = [];

// Automatic
app.post('/git', (req, res) => {
	const hmac = crypto.createHmac('sha1', process.env.SECRET);
	const sig = 'sha1=' + hmac.update(JSON.stringify(req.body)).digest('hex');
	if (req.headers['x-github-event'] === 'push' && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(req.headers['x-hub-signature']))) {
		res.sendStatus(200);
		const commands = [
			'git fetch origin main',
			'git reset --hard origin/main',
			'git pull origin main --force',
			'npm install',
			// your build commands here
			'refresh',
		]; // fixes glitch ui
		for (const cmd of commands) {
			console.log(execSync(cmd).toString());
		}
		console.log('Updated with SteamlabsCA/AiTraining!');
		return;
	} else {
		console.log('webhook signature incorrect!');
		return res.sendStatus(403);
	}
});

app.use('/static', express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
	// Redirect to secure protocol if on insecure connection
	if (process.env.NODE_ENV == 'production' && req.get('X-Forwarded-Proto').indexOf('https') == -1) {
		res.redirect('https://' + req.hostname + req.url);
	}
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(process.env.PORT || 80, () => console.log('Server started'));

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
