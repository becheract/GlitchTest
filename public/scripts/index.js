$(document).ready(function () {
	(() => {
		if (port) {
			$('#connectPort').show();
		}
	})();
});
// const socket = io();
// const socket = io('http://localhost:8080');

// socket.on('connect', () => {});
// let URL = 'https://teachablemachine.withgoogle.com/models/TmHiXRkQy/';

let model, webcam, labelContainer, maxPredictions, ctx, found;

function submitUrl() {
	if (validURL(teachableUrl.value)) {
		$('#webcam-container').hide();
		$('#canvas').hide();
		$('#label-container').hide();
		$('#startButton').show();
	} else {
		alert('invalid URL');
	}
}

startButton.onclick = () => {
	if (validURL(teachableUrl.value)) {
		$('#startButton').addClass('disabled');
		$('#startButton').text('Loading');
		$('#startButton').addClass('loading');
		found = false;
		openPort();
		chooseModel(teachableUrl.value);
	} else {
		alert('invalid URL');
	}
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
