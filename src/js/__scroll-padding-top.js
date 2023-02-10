/**
 * Scroll Padding Top
 *
 * @author Takuto Yanagida
 * @version 2023-02-10
 */

function initializeScrollPaddingTop() {
	const de = document.documentElement;
	if (de.getAttribute('data-scroll-padding-top') !== null) return;
	de.setAttribute('data-scroll-padding-top', '');

	const mo = new MutationObserver((ms, mo) => update(mo));
	mo.observe(de, { attributes: true });
	update(mo);

	function update(mo) {
		const de = document.documentElement;

		mo.disconnect();
		de.style.scrollPaddingTop = null;

		const v = parseInt(getComputedStyle(de).scrollPaddingTop);
		setScrollPaddingTop('default', Number.isNaN(v) ? 0 : v);

		de.style.scrollPaddingTop = getScrollPaddingTop() + 'px';
		mo.observe(de, { attributes: true });
	}
}

function setScrollPaddingTop(key, val) {
	const de = document.documentElement;
	const at = de.getAttribute('data-scroll-padding-top');
	const vs = at ? new Map(at.split(',').map(e => e.split(':'))) : new Map();
	if (val) {
		vs.set(key, val);
	} else {
		vs.delete(key);
	}
	de.setAttribute('data-scroll-padding-top', [...vs].map(e => e.join(':')).join(','));
}

function getScrollPaddingTop(without = null) {
	const de = document.documentElement;
	const at = de.getAttribute('data-scroll-padding-top');
	if (!at) return 0;

	const vs = at.split(',').map(e => e.split(':')).filter(([key,]) => key !== without).map(([k, v]) => parseInt(v));
	return vs.reduce((a, b) => a + b, 0);
}
