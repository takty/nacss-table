/**
 * Utilities
 *
 * @author Takuto Yanagida
 * @version 2021-12-06
 */

function getScrollOffset() {
	const s   = getComputedStyle(document.documentElement);
	const val = parseInt(s.scrollPaddingTop);
	return Number.isNaN(val) ? 0 : val;
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
