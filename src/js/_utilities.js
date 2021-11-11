/**
 *
 * Utilities
 *
 * @author Takuto Yanagida
 * @version 2021-11-11
 *
 */


function getScrollOffset() {
	const s = getComputedStyle(document.documentElement);
	return parseInt(s.scrollPaddingTop);
}


// -----------------------------------------------------------------------------


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

const resizeListeners = [];

function onResize(fn, doFirst = false) {
	if (doFirst) fn();
	resizeListeners.push(throttle(fn));
}

document.addEventListener('DOMContentLoaded', () => {
	window.addEventListener('resize', () => {
		for (const l of resizeListeners) l();
	}, { passive: true });
});
