/**
 *
 * Utilities
 *
 * @author Takuto Yanagida
 * @version 2021-10-25
 *
 */


function enableClass(enabled, tar, cls) {
	const key = cls.substr(1);
	if (cls.startsWith(':')) {
		if (enabled) {
			tar.dataset[key] = '';
		} else {
			delete tar.dataset[key];
		}
	} else {
		if (enabled) {
			tar.classList.add(key);
		} else {
			tar.classList.remove(key);
		}

	}
}

function getSelector(cls) {
	if (cls.startsWith(':')) {
		return `*[data-${cls.substr(1).replace(/([A-Z])/g, c => '-' + c.charAt(0).toLowerCase())}]`;
	} else {
		return `*${cls}`;
	}
}

function getScrollOffset() {
	const s = getComputedStyle(document.getElementsByTagName('html')[0]);
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
