/**
 *
 * Style Class Utilities
 *
 * @author Takuto Yanagida
 * @version 2021-11-11
 *
 */


function hasClass(tar, cls) {
	const key = cls.substr(1);
	if (cls.startsWith(':')) {
		return tar.dataset[key] !== undefined;
	} else {
		return tar.classList.contains(key);
	}
}

function setClass(tar, cls, enabled = true, val = '') {
	const key = cls.substr(1);
	if (cls.startsWith(':')) {
		if (enabled) {
			tar.dataset[key] = val;
		} else {
			delete tar.dataset[key];
		}
	} else {
		const c = [key, val].join('-');
		if (enabled) {
			tar.classList.add(c);
		} else {
			tar.classList.remove(c);
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
