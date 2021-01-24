/**
 *
 * Utilities
 *
 * @author Takuto Yanagida
 * @version 2021-01-25
 *
 */


function enableClass(enabled, tar, cls) {
	if (enabled) {
		if (cls.startsWith(':')) tar.dataset[cls.substr(1)] = '';
		else tar.classList.add(cls.substr(1));
	} else {
		if (cls.startsWith(':')) delete tar.dataset[cls.substr(1)];
		else tar.classList.remove(cls.substr(1));
	}
}

function throttle(fn) {
	let isRunning;
	return (...args) => {
		if (isRunning) return;
		isRunning = true;
		requestAnimationFrame(() => {
			isRunning = false;
			fn(...args);
		});
	};
}