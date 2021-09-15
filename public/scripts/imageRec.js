// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel

// Load the image model and setup the webcam
async function initImg() {
	maxPredictions = model.getTotalClasses();

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
		// and class labels
		$('#label-container').append(`<div class='meter'><p class='label'></p><span class='meter-container'><span><p></p></span></span></div>`);
	}
}

async function imgLoop() {
	if (!found) {
		webcam.update(); // update the webcam frame
		await ImgPredict();
		window.requestAnimationFrame(imgLoop);
	}
}

// run the webcam image through the image model
async function ImgPredict() {
	// predict can take in an image, video or canvas html element
	const prediction = await model.predict(webcam.canvas);

	for (let i = 0; i < maxPredictions; i++) {
		labelContainer.childNodes[i].firstChild.innerHTML = prediction[i].className;
		labelContainer.childNodes[i].childNodes[1].firstChild.style.width = `${Math.floor(prediction[i].probability * 100)}%`;
		labelContainer.childNodes[i].childNodes[1].firstChild.firstChild.innerHTML = `${Math.floor(prediction[i].probability * 100)}%`;

		if (prediction[i].probability.toFixed(2) > 0.94) {
			serialSubmit(prediction[i].className);
			found = true;
		}
	}
}
