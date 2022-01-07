/**
 *
 * Scroll Padding Top
 *
 * @author Takuto Yanagida
 * @version 2022-01-07
 *
 */


function initializeScrollPaddingTop() {
	const html = document.documentElement;
	if (html.getAttribute('data-scroll-padding-top') !== null) return;
	html.setAttribute('data-scroll-padding-top', '');

	const mo = new MutationObserver(updateScrollPaddingTop);
	mo.observe(html, { attributes: true });

	const v = parseInt(getComputedStyle(html).scrollPaddingTop);
	setScrollPaddingTop('default', Number.isNaN(v) ? 0 : v);
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

function getScrollPaddingTop(without = null) {
	const html = document.documentElement;
	const a    = html.getAttribute('data-scroll-padding-top');
	if (!a) return 0;

	const vs = a.split(',').map(e => e.split(':')).filter(([key,]) => key !== without).map(([k, v]) => parseInt(v));
	return vs.reduce((a, b) => a + b, 0);
}


// -----------------------------------------------------------------------------


function updateScrollPaddingTop() {
	const html = document.documentElement;
	html.style.scrollPaddingTop = getScrollPaddingTop() + 'px';
}
