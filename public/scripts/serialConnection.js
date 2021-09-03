let port;
let open;
let reading;
let writing;
let reader;
let readableStreamClosed;
let writer;
let writableStreamClosed;

console.log(`("serial" in navigator): ${'serial' in navigator}`);

navigator.serial.getPorts().then(async (ports) => {
	if (ports.length == 0) {
		console.log('no serial ports');
		return;
	}
	port = ports[0];
	console.log(port);
});

requestPortButton.onclick = async (event) => {
	document.body.style.display = 'none';
	try {
		port = await navigator.serial.requestPort({
			// filters: [{ usbVendorId: 0x0d28, usbProductId: 0x0204 }]
		});
		console.log(port);
		$('#connectPort').show();
	} catch (error) {
		console.log(error);
	} finally {
		document.body.style.display = '';
	}
};

async function openPort() {
	if (!open) {
		await port.open({ baudRate: 9600 });
		// console.log(port);
		open = true;
		$('#openPort').show();
		console.log('Port connected to Microbit');
	} else {
		console.log('Port already open...');
	}
}

openPortButton.onclick = (event) => {
	openPort();
};

readButton.onclick = async (event) => {
	// reader = port.readable.getReader();

	const textDecoder = new TextDecoderStream();
	readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
	// textReader = textDecoder.readable.getReader();
	reader = textDecoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer())).getReader();
	console.log('Reader Connected');
	reading = true;

	while (true) {
		const { value, done } = await reader.read();
		if (done) {
			reader.releaseLock();
			reading = false;
			break;
		}
		if (value) {
			console.log(value);
		}
	}
};

async function read() {
	// reader = port.readable.getReader();

	const textDecoder = new TextDecoderStream();
	readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
	// textReader = textDecoder.readable.getReader();
	reader = textDecoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer())).getReader();
	console.log('Reader Connected');
	reading = true;

	while (true) {
		const { value, done } = await reader.read();
		if (done) {
			reader.releaseLock();
			reading = false;
			break;
		}
		if (value) {
			console.log(value);
		}
	}
}

testButton.onclick = async (event) => {
	// writer = port.writable.getWriter();
	// const data = new Uint8Array([116, 114, 117, 101, 10]); // "true\n"
	// await writer.write(data);
	// writer.releaseLock();

	if (!writer) {
		const textEncoder = new TextEncoderStream();
		writableStreamClosed = textEncoder.readable.pipeTo(port.writable);

		writer = textEncoder.writable.getWriter();
		writing = true;
	}
	await writer.write('test');
};

async function writeToSerial(value) {
	// writer = port.writable.getWriter();
	// const data = new Uint8Array([116, 114, 117, 101, 10]); // "true\n"
	// await writer.write(data);
	// writer.releaseLock();
	$('#startButton').removeClass('loading');
	$('#startButton').text('Start!');

	if (!writer) {
		const textEncoder = new TextEncoderStream();
		writableStreamClosed = textEncoder.readable.pipeTo(port.writable);

		writer = textEncoder.writable.getWriter();
		writing = true;
	}
	await writer.write(value);
}

closeButton.onclick = (event) => {
	closePort();
};

async function closePort() {
	if (open) {
		// // With no transform streams but still with a loop
		// await reader.cancel();
		// console.log("await reader.cancel()");
		try {
			// With transform streams.
			if (reading) {
				reader.cancel().catch((error) => console.log(error));
				await readableStreamClosed.catch(() => {});
				console.log('Reader Disconnected');
				reading = false;
				reader = null;
			}

			if (writing) {
				writer.close();
				await writableStreamClosed;
				console.log('Writing Disconnected');
				writing = false;
				writer = null;
			}
		} catch (error) {
			console.log(error);
		} finally {
			await port.close();
			$('#openPort').hide();
			console.log('Port disconnected from Microbit');
			open = false;
		}
	} else {
		console.log('Port already closed...');
	}
}

navigator.serial.addEventListener('connect', async (event) => {
	console.log(event);
	port = event.port;
	await port.open({ baudrate: 9600 });
	console.log(port);
});

navigator.serial.addEventListener('disconnect', (event) => {
	console.log(event);
});

class LineBreakTransformer {
	constructor() {
		// A container for holding stream data g stream data until a new line.
		this.chunks = '';
	}

	transform(chunk, controller) {
		// Append new chunks to existing chunks.
		this.chunks += chunk;
		// For each line breaks in chunks, send the parsed lines out.
		const lines = this.chunks.split('\r\n');
		this.chunks = lines.pop();
		lines.forEach((line) => controller.enqueue(line));
		console.debug(`[LineBreakTransformer/transform] this.chunks: ${this.chunks}`);
	}

	flush(controller) {
		console.log('flush', this.chunks);
		// When the stream is closed, flush any remaining chunks out.
		controller.enqueue(this.chunks);
	}
}
