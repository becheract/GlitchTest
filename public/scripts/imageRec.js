// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel

let imgArr = [];
let imgSensitivity = 20;

// Load the image model and setup the webcam
async function initImg() {
	maxPredictions = model.getTotalClasses();
	let classLabels = model.getClassLabels();
	imgArr = new Array(maxPredictions);

	// Convenience function to setup a webcam
	const flip = true; // whether to flip the webcam
	webcam = new tmImage.Webcam(500, 500, flip); // width, height, flip
	await webcam.setup(); // request access to the webcam
	$('#startButton').fadeOut(() => {
		$('#canvas').hide(() => {
			$('#webcam-container').show();
			$('#label-container').fadeIn();
		});
	});
	await webcam.play();
	window.requestAnimationFrame(imgLoop);

	// append elements to the DOM
	let cameraContainer = document.getElementById('webcam-container');
	if (cameraContainer.hasChildNodes()) {
		cameraContainer.removeChild(cameraContainer.firstChild);
		cameraContainer.appendChild(webcam.canvas);
	} else {
		cameraContainer.appendChild(webcam.canvas);
	}

	labelContainer = document.getElementById('label-container');

	for (let i = 0; i < maxPredictions; i++) {
		$('#label-container').append(
			`<div class='meter' id="${classLabels[i]}"><p class='label'></p><span class='meter-container'><span><p></p></span></span><span class='toggle-container'><label class="switch"><input type="checkbox" class="toggle-switch" checked><span class="slider round"></span></label></span></div>`
		);
		imgArr[i] = 0;
	}
}

async function imgLoop() {
	if (!found.bool || found.continous) {
		let ignoredClass = false;

		webcam.update(); // update the webcam frame
		let foundPrediction = await ImgPredict();
		if (foundPrediction.foundI || foundPrediction.foundI === 0) imgArr[foundPrediction.foundI]++;
		if (imgArr[foundPrediction.foundI] > imgSensitivity) {
			for (let j = 0; j < ignoredClasses.length; j++) {
				if (ignoredClasses[j] === foundPrediction.className) {
					ignoredClass = true;
				}
			}
			if (!ignoredClass) {
				found.bool = true;
				for (let i = 0; i < imgArr.length; ++i) imgArr[i] = 0;
				serialSubmit(foundPrediction.className);
			} else {
				imgArr[foundPrediction.foundI] = 0;
				ignoredClass = false;
			}
		}
		window.requestAnimationFrame(imgLoop);
	}
}

// run the webcam image through the image model
async function ImgPredict() {
	let foundI;
	let className;
	// predict can take in an image, video or canvas html element
	const prediction = await model.predict(webcam.canvas);

	for (let i = 0; i < maxPredictions; i++) {
		labelContainer.childNodes[i].firstChild.innerHTML = prediction[i].className;
		labelContainer.childNodes[i].childNodes[1].firstChild.style.width = `${Math.floor(prediction[i].probability * 100)}%`;
		labelContainer.childNodes[i].childNodes[1].firstChild.firstChild.innerHTML = `${Math.floor(prediction[i].probability * 100)}%`;

		if (prediction[i].probability.toFixed(2) > 0.94) {
			foundI = i;
			className = prediction[i].className;
		}
	}
	return { foundI: foundI, className: className };
}
