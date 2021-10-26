// more documentation available at
// https://github.com/tensorflow/tfjs-models/tree/master/speech-commands

// the link to your model provided by Teachable Machine export panel
// const URL = 'https://teachablemachine.withgoogle.com/models/RXd6aD1HY/';

let audArr = [];
let audSensitivity = 3;

async function createModel(checkpointURL, metadataURL) {
	const recognizer = speechCommands.create(
		'BROWSER_FFT', // fourier transform type, not useful to change
		undefined, // speech commands vocabulary feature, not useful for your models
		checkpointURL,
		metadataURL
	);

	// check that model and metadata are loaded via HTTPS requests.
	await recognizer.ensureModelLoaded();

	return recognizer;
}

async function initAudio(modelURL, metadataURL) {
	const recognizer = await createModel(modelURL, metadataURL);
	const classLabels = recognizer.wordLabels(); // get class labels
	const labelContainer = document.getElementById('label-container');
	audArr = new Array(classLabels.length);

	for (let i = 0; i < classLabels.length; i++) {
		$('#label-container').append(
			`<div class='meter' id="${classLabels[i]}"><p class='label'></p><span class='meter-container'><span><p></p></span></span><span class='toggle-container'><label class="switch"><input type="checkbox" class="toggle-switch" ><span class="slider round"></span></label></span></div>`
		);
		audArr[i] = 0;
	}

	$('#webcam-container').hide(() => {
		$('.projectName').removeClass('loading');
		$('.projectName').text('AUDIO MODEL');
		$('#audio-container').fadeIn();
		$('#canvas').hide();
	});
	$('#label-container').fadeIn();

	// listen() takes two arguments:
	// 1. A callback function that is invoked anytime a word is recognized.
	// 2. A configuration object with adjustable fields

	recognizer.listen(
		(result) => {
			if (continous) {
				if (!continous && heldClasses.length > 0) continous = false;
				// render the probability scores per class
				for (let i = 0; i < classLabels.length; i++) {
					labelContainer.childNodes[i].firstChild.innerHTML = classLabels[i];
					labelContainer.childNodes[i].childNodes[1].firstChild.style.width = `${Math.floor(result.scores[i] * 100)}%`;
					labelContainer.childNodes[i].childNodes[1].firstChild.firstChild.innerHTML = `${Math.floor(result.scores[i] * 100)}%`;
					if (result.scores[i].toFixed(2) > 0.9) {
						audArr[i]++;

						if (audArr[i] > audSensitivity) {
							for (let j = 0; j < heldClasses.length; j++) {
								if (heldClasses[j] === classLabels[i]) {
									continous = false;
								}
							}
							if (classLabels[i] !== lastDetection) {
								for (let i = 0; i < audArr.length; ++i) audArr[i] = 0;
								lastDetection = classLabels[i];
								serialSubmit(classLabels[i]);
							} else {
								audArr[i] = 0;
							}
						}
					}
				}
			}
		},
		{
			includeSpectrogram: true, // in case listen should return result.spectrogram
			probabilityThreshold: 0.75,
			invokeCallbackOnNoiseAndUnknown: true,
			overlapFactor: 0.5, // probably want between 0.5 and 0.75. More info in README
		}
	);
	// Stop the recognition in 5 seconds.
	// setTimeout(() => recognizer.stopListening(), 5000);
}
