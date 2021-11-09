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

const socket = io();
// const socket = io('http://localhost:8080');

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
			$('#results').removeClass('init-hide-imp');
			found.bool = false;
			openPort();
			chooseModel(teachableUrl.value);
			changePage(true);
		});
	} else {
		alertUser('Invalid URL');
	}
});

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
	$('.projectName').text('Loading');
	$('.projectName').addClass('loading');

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

// Serial Submit to  Microbit
function serialSubmit(classPrediction) {
	addLog(`AI predicted ${classPrediction}`);
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

$('#label-container').on('click', '.toggle-switch', function (event) {
	event.stopPropagation();
	event.stopImmediatePropagation();
	let id = $(this).parents()[2].id;
	for (let i = 0; i < heldClasses.length; i++) {
		if (heldClasses[i] === id) {
			addLog(`${id} removed stop and hold`);
			heldClasses.splice(i, 1);
			continous = true;
			return;
		}
	}

	addLog(`${id} assigned stop and hold`);
	heldClasses.push(id);
});

$('#closePortBtn').click(() => {
	closePort();
	$('#closePortBtn').fadeOut(() => {
		$('#connect-msg').fadeOut('slow', () => {
			$('#disconnect-msg').fadeIn();
		});
	});
});

$('#help-button').click(() => {
	$('.help-content').slideToggle();
});

$('#message-log').click(() => {
	$('.log-content').slideToggle();
});

// Custom Alert Function
function alertUser(msg) {
	$('#alert-text').text(msg);
	$('#alert-div').fadeIn(() => {
		$('#alert-ok').click(() => {
			$('#alert-div').fadeOut();
		});
	});
}

//Log Microbit Site actions
function addLog(event) {
	if ($('#log p').attr('id') === 'firstLog') {
		$('#log').html(`<p class="log-paragraph"><strong>${new Date().toLocaleTimeString()}</strong>   ${event}</p><hr>`);
	} else {
		$('#log').append(`<p class="log-paragraph"><strong>${new Date().toLocaleTimeString()}</strong>   ${event}</p><hr>`);
	}
}
