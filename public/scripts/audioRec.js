// more documentation available at
// https://github.com/tensorflow/tfjs-models/tree/master/speech-commands

// the link to your model provided by Teachable Machine export panel
// const URL = 'https://teachablemachine.withgoogle.com/models/RXd6aD1HY/';

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

	for (let i = 0; i < classLabels.length; i++) {
		$('#label-container').append(`<div class='meter'><p class='label'></p><span class='meter-container'><span><p></p></span></span></div>`);
	}
	$('#startButton').fadeOut(() => {
		$('#webcam-container').hide(() => {
			$('#audio-container').fadeIn();
			$('#canvas').hide();
		});
		$('#label-container').fadeIn();
	});

	// listen() takes two arguments:
	// 1. A callback function that is invoked anytime a word is recognized.
	// 2. A configuration object with adjustable fields
	recognizer.listen(
		(result) => {
			const scores = result.scores; // probability of prediction for each class
			// render the probability scores per class
			for (let i = 0; i < classLabels.length; i++) {
				labelContainer.childNodes[i].firstChild.innerHTML = classLabels[i];
				labelContainer.childNodes[i].childNodes[1].firstChild.style.width = `${Math.floor(result.scores[i] * 100)}%`;
				labelContainer.childNodes[i].childNodes[1].firstChild.firstChild.innerHTML = `${Math.floor(result.scores[i] * 100)}%`;
				if (result.scores[i].toFixed(2) > 0.9 && classLabels[i] !== 'Background Noise') {
					serialSubmit(classLabels[i]);
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
