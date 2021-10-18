let model, webcam, labelContainer, maxPredictions, ctx, modelName, socketId;
let pageNumber = 1;
let ignoredClasses = [];
let found = {
	continous: true,
	bool: false,
};

let heldClasses = [];
let continous = true;
let lastDetection = '';

// const socket = io();
const socket = io('http://localhost:8080');

socket.on('user-id', (userId) => {
	console.log('Connected with id: ' + userId);
	socketId = userId;
});

socket.on('disconnect', () => {
	console.log(`User disconnected`);
});

submitUrl.onclick = () => {
	socket.emit('check-url', { url: teachableUrl.value, socketId: socketId });
};

socket.on('valid-url', (valid) => {
	if (valid) {
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

	found.bool = false;
	openPort();
	chooseModel(teachableUrl.value);
};

// Choose between Image, Pose or Audio model based on the URL
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
	$('.undercard').fadeIn();
	if (metaName === 'tm-my-image-model') {
		$('.projectName').text('IMAGE MODEL');
		initImg();
	} else if (metaName === 'TMv2') {
		$('.projectName').text('AUDIO MODEL');
		initAudio(modelURL, metadataURL);
	} else if (metaName === 'my-pose-model') {
		$('.projectName').text('POSE MODEL');
		model = await tmPose.load(modelURL, metadataURL);
		initPose();
	} else {
		console.log('Error');
	}
}

// Serial Submit to  Microbit
function serialSubmit(classPrediction) {
	writeToSerial(classPrediction);
}

// Change site page
function changePage(direction) {
	if (direction) {
		setTimeout(function () {
			$(`#page-${pageNumber}`).fadeOut('fast', function () {
				pageNumber++;
				$(`#page-${pageNumber}`).fadeIn('slow');
			});
		}, 100);
	}
}

// $('#label-container').on('click', '.toggle-switch', function (event) {
// 	event.stopPropagation();
// 	event.stopImmediatePropagation();
// 	let id = $(this).parents()[2].id;
// 	for (let i = 0; i < ignoredClasses.length; i++) {
// 		if (ignoredClasses[i] === id) {
// 			ignoredClasses.splice(i, 1);
// 			return;
// 		}
// 	}
// 	continous = true;
// 	ignoredClasses.push(id);
// });

$('#label-container').on('click', '.toggle-switch', function (event) {
	event.stopPropagation();
	event.stopImmediatePropagation();
	let id = $(this).parents()[2].id;
	for (let i = 0; i < heldClasses.length; i++) {
		if (heldClasses[i] === id) {
			heldClasses.splice(i, 1);
			//test
			console.log(`${id}: removed`);
			continous = true;
			return;
		}
	}

	//test
	console.log(`${id}: added`);
	heldClasses.push(id);
});
