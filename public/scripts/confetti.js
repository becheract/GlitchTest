var count = 50;
var defaults = {
	origin: { y: 1 },
};

function fire(particleRatio, opts) {
	window.confetti(
		Object.assign({}, defaults, opts, {
			particleCount: Math.floor(count * particleRatio),
		})
	);
}

function party() {
	console.log('party');
	fire(0.25, {
		spread: 26,
		startVelocity: 55,
	});
	fire(0.2, {
		spread: 60,
	});
	fire(0.35, {
		spread: 100,
		decay: 0.91,
		scalar: 0.8,
	});
	fire(0.1, {
		spread: 120,
		startVelocity: 25,
		decay: 0.92,
		scalar: 1.2,
	});
	fire(0.1, {
		spread: 120,
		startVelocity: 45,
	});
}
