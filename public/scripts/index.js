// const socket = io();
// const socket = io('http://localhost:8080');

// socket.on('connect', () => {});
// let URL = 'https://teachablemachine.withgoogle.com/models/TmHiXRkQy/';

submitUrl.onclick = (event) => {
	if (validURL(teachableUrl.value)) {
		found = false;
		openPort();
		init(teachableUrl.value);
	} else {
		alert('invalid URL');
	}
};

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
