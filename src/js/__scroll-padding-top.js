/**
 *
 * Scroll Padding Top
 *
 * @author Takuto Yanagida
 * @version 2022-01-06
 *
 */


function initializeScrollPaddingTop() {
	const html = document.documentElement;
	if (html.getAttribute('data-scroll-padding-top') !== null) return;
	html.setAttribute('data-scroll-padding-top', '');

	const mo = new MutationObserver(updateScrollPaddingTop);
	mo.observe(html, { attributes: true });
}

function setScrollPaddingTop(key, val) {
	const html = document.documentElement;
	const a    = html.getAttribute('data-scroll-padding-top');
	const vs   = a ? new Map(a.split(',').map(e => e.split(':'))) : new Map();
	if (val) {
		vs.set(key, val);
	} else {
		vs.delete(key);
	}
	html.setAttribute('data-scroll-padding-top', Array.from(vs).map(e => e.join(':')).join(','));
	updateScrollPaddingTop();
}


// -----------------------------------------------------------------------------


function updateScrollPaddingTop() {
	const html = document.documentElement;
	const a    = html.getAttribute('data-scroll-padding-top');
	if (a === '') {
		html.style.scrollPaddingTop = null;
	} else {
		const vs = a.split(',').map(e => e.split(':')[1]);
		html.style.scrollPaddingTop = `calc(${vs.join(' + ')})`;
	}
}
