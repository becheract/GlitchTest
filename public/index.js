let model, webcam, labelContainer, maxPredictions, ctx, modelName, socketId;
let cookie = false;
let pageNumber = 1;
let maxPageNum = 3;
let ignoredClasses = [];
let found = {
	continous: true,
	bool: false,
};

let heldClasses = [];
let continous = true;
let lastDetection = '';
let settingsOpen = false;
let sensitivity;

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
	if (valid && window.innerWidth > 900) {
		$('#webcam-container').fadeOut(() => {
			$('#canvas').fadeOut();
			$('#label-container').fadeOut();
			$('#results').removeClass('hide-imp');
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

	if (!cookie) {
		showInstructions();
	} else {
		$('#overlay').fadeIn();
	}

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
	party();
	addLog(`AI sent ${classPrediction} to the Microbit`);
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

//Toggle the settings button
function toggleSettings(el) {
	settingsOpen = !settingsOpen;
	el.classList.toggle('spin');
	$('.switch, .slider-container').toggleClass('inline-block');
	$('.check').toggleClass('hide-imp');
	$('.popup').toggleClass('flex');
	if (!settingsOpen) {
		$('.settings-tooltip').text('Open Settings');
		$('#results-heading').fadeOut(function () {
			$(this).text('RESULTS!').fadeIn();
		});
		$('.popuptext, .settings-hidden').fadeOut();
	} else {
		$('.settings-tooltip').text('Close Settings');
		$('#results-heading').fadeOut(function () {
			$(this).text('SETTINGS!').fadeIn();
			$('.settings-hidden').fadeIn();
		});
	}
}

// Create the cookie to expire in 30 days
function setCookie(cname) {
	const d = new Date();
	d.setTime(d.getTime() + 30 * 24 * 60 * 60 * 1000);
	let expires = 'expires=' + d.toUTCString();
	document.cookie = cname + '=ai-training;' + expires + ';path=/';
}

// Get any available cookies
function getCookie(cname) {
	let name = cname + '=';
	let ca = document.cookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return '';
}

// Check if there's relevant cookies
function checkCookie() {
	let user = getCookie('username');
	if (user != '') {
		cookie = true;
	} else {
		setCookie('username', user);
	}
}

function createClasses(classes, modelLength = false) {
	let length = modelLength || classes.length;
	let arr = new Array(length);
	for (let i = 0; i < length; i++) {
		$('#label-container').append(
			`<div class='meter' id="${
				classes[i]
			}"><p class='label'></p><span class='meter-container'><span><p></p></span></span><span class='toggle-container'><span class="check" ><img class="check-img" id="check-${[
				i,
			]}" src="static/assets/images/check_bold.svg" alt="checkmark"></span><label class="switch"><input type="checkbox" class="toggle-switch" ><span class="slider round"></span></label></span></div>`
		);
		arr[i] = 0;
	}
	return arr;
}

function togglePopup(popup) {
	$(`#${popup}`).slideToggle();
}

$('#slider').slider({
	range: 'min',
	min: 0,
	max: 100,
	value: 15,
	slide: function (event, ui) {
		$('#amount').val(ui.value);
		sensitivity = ui.value;
		$(this).find('.ui-slider-handle').text(`${sensitivity}%`);
	},
	create: function (event, ui) {
		sensitivity = $(this).slider('value');
		$(this).find('.ui-slider-handle').text(`${sensitivity}%`);
	},
});

// show the instruction modules
function showInstructions() {
	$('#overlay').fadeIn();
	$('#settingsInfo').fadeIn(() => {
		$('#settingsInfo button').on('click', () => {
			$('#settingsInfo').fadeOut(() => {
				$('#newCodeInfo').fadeIn(() => {
					$('#newCodeInfo button').on('click', () => {
						$('#newCodeInfo').fadeOut(() => {
							$('#logInfo').fadeIn(() => {
								$('#logInfo button').on('click', () => {
									$('#overlay').hide();
									$('#logInfo').hide();
								});
							});
						});
					});
				});
			});
		});
	});
}
