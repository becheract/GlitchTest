let model, webcam, labelContainer, maxPredictions, ctx, found, modelName, socketId;
let pageNumber = 1;

// const socket = io();
const socket = io('http://localhost:8080');

socket.on('user-id', (userId) => {
	console.log('Connected with id: ' + userId);
	socketId = userId;
});

socket.on('disconnect', () => {
	console.log(`User disconnected`);
});

function pickModel(model) {
	modelName = model;
	changePage(true);
}

submitUrl.onclick = () => {
	socket.emit('check-url', { url: teachableUrl.value, socketId: socketId });
};

socket.on('valid-url', (valid) => {
	if (valid) {
		$('.nav').addClass('init-hide-imp');
		$('#webcam-container').fadeOut(() => {
			$('#canvas').fadeOut();
			$('#label-container').fadeOut();
			$('#startButton').removeClass('disabled');
			$('#startButton').text('Start!');
			$('#startButton').removeClass('loading');
			$('#startButton').fadeIn();
			changePage(true);
		});
	} else {
		alert('invalid URL');
	}
});

startButton.onclick = () => {
	$('#startButton').addClass('disabled');
	$('#startButton').text('Loading');
	$('#startButton').addClass('loading');
	$('#results').removeClass('init-hide-imp');
	found = false;
	openPort();
	chooseModel(teachableUrl.value);
};

async function chooseModel(URL) {
	const modelURL = URL + 'model.json';
	const metadataURL = URL + 'metadata.json';

	// load the model and metadata
	// Refer to tmImage.loadFromFiles() in the API to support files from a file picker
	// or files from your local hard drive
	// Note: the pose library adds "tmImage" object to your window (window.tmImage)
	// Note: the pose library adds a tmPose object to your window (window.tmPose)
	model = await tmImage.load(modelURL, metadataURL);
	let metaName = model._metadata.modelName;
	if (metaName === 'tm-my-image-model') {
		initImg();
	} else if (metaName === 'TMv2') {
		initAudio(modelURL, metadataURL);
	} else if (metaName === 'my-pose-model') {
		model = await tmPose.load(modelURL, metadataURL);
		initPose();
	} else {
		console.log('Error');
	}
}

function serialSubmit(classPrediction) {
	writeToSerial(classPrediction);
}

function changePage(direction) {
	if (direction) {
		if (pageNumber === 1) {
			setTimeout(function () {
				$(`#page-${pageNumber}`).fadeOut('fast', function () {
					$('.nav').removeClass('init-hide-imp');
					$('.projectName').text(modelName);
					pageNumber++;
					$(`#page-${pageNumber}`).fadeIn('slow');
				});
			}, 100);
		} else {
			setTimeout(function () {
				$(`#page-${pageNumber}`).fadeOut('fast', function () {
					pageNumber++;
					$(`#page-${pageNumber}`).fadeIn('slow');
				});
			}, 100);
		}
	}
}
