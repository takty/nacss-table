/**
 *
 * Usable View (JS)
 *
 * @author Takuto Yanagida
 * @version 2021-01-20
 *
 */


const ST_HEADER_CONTAINER = 'fixed-table-header-container';
const ST_HEADER_TABLE     = 'fixed-table-header-table';
const ST_SCROLL_BAR       = 'fixed-table-scroll-bar';

const CAPABLE_WINDOW_HEIGHT_RATIO = 0.9;

let getOffset = () => { return 0; };


// -------------------------------------------------------------------------


function initialize(tabs) {
	const cs = [];
	for (const t of tabs) {
		const c = _create(t);
		setTimeout(() => { _initialize(c.tab, c.head, c.bar); }, 10);
		cs.push(c);
	}
	window.addEventListener('scroll', throttle(() => { for (const c of cs) {
		onWindowScroll(c.tab, c.head, c.bar);
	}}), { passive: true });
}

function _create(tab) {
	const head = createHeaderClone(tab);
	const bar = createScrollBarClone(tab);
	return {tab, head, bar};
}

function createHeaderClone(tab) {
	let thead = tab.tHead;
	if (!thead) {
		thead = createPseudoHeader(tab);
		if (!thead) return null;
		tab.tHead = thead;
	}
	const cont = document.createElement('div');
	cont.dataset.stile += ' ' + ST_HEADER_CONTAINER;
	tab.parentNode.appendChild(cont);

	const ptab = document.createElement('div');
	ptab.dataset.stile += ' ' + ST_HEADER_TABLE;
	cont.appendChild(ptab);

	const clone = thead.cloneNode(true);
	ptab.appendChild(clone);
	return cont;
}

function createPseudoHeader(tab) {
	const tbody = tab.tBodies[0];
	const trs = tbody.rows;
	if (trs.length === 0) return null;

	function containsOnlyTh(tr) {
		const tds = tr.getElementsByTagName('td');
		const ths = tr.getElementsByTagName('th');
		if (tds.length === 0 && ths.length > 0) return true;
		return false;
	}

	const trsH = [];
	for (let i = 0, I = trs.length; i < I; i += 1) {
		const tr = trs[i];
		if (!containsOnlyTh(tr)) break;
		trsH.push(tr);
	}
	if (trsH.length === 0) return null;

	const thead = tab.createTHead();
	for (let i = 0; i < trsH.length; i += 1) {
		thead.appendChild(trsH[i]);
	}
	return thead;
}

function createScrollBarClone(tab) {
	const e = document.createElement('div');
	e.dataset.stile += ' ' + ST_SCROLL_BAR;
	const spacer = document.createElement('div');
	e.appendChild(spacer);
	tab.parentNode.appendChild(e);
	return e;
}


// ---------------------------------------------------------------------


function _initialize(tab, head, bar) {
	initTableScroll(tab, head, bar);
	new ResizeObserver((e) => {
		onResize(e[0].contentRect, tab, head, bar);
	}).observe(tab);
}

function initTableScroll(tab, head, bar) {
	let forced = false;
	const el = (tar, op) => throttle(() => {
		if (forced) {
			forced = false;
		} else {
			forced = true;
			op.scrollLeft = tar.scrollLeft;
			onTableScroll(tab, head);
		}
	});
	tab.addEventListener('scroll', el(tab, bar));
	bar.addEventListener('scroll', el(bar, tab));
}


// ---------------------------------------------------------------------


function onResize(r, tab, head, bar) {
	tab.style.overflowX = (tab.scrollWidth < tab.clientWidth + 2) ? 'hidden' : '';

	if (head) _updateHeaderSize(r, tab, head);
	if (bar) updateScrollBarSize(tab, bar);
	if (head || bar) onWindowScroll(tab, head, bar);
	onTableScroll(tab, head);
}

function _updateHeaderSize(r, tab, head) {
	const tw = r ? r.width : tab.getBoundingClientRect().width;
	head.style.maxWidth = tw + 'px';
	head.style.display = 'none';
	head.style.top = getOffset() + 'px';

	const thead = tab.tHead;
	const hw = thead.getBoundingClientRect().width;
	const ptab = head.firstChild;
	ptab.style.width = hw + 'px';

	const clone = ptab.firstChild;

	const oTrs = thead.rows;
	const cTrs = clone.rows;
	for (let i = 0; i < oTrs.length; i += 1) {
		copyWidth(oTrs[i], cTrs[i], 'td');
		copyWidth(oTrs[i], cTrs[i], 'th');
	}
	function copyWidth(o, c, tag) {
		const os = o.getElementsByTagName(tag);
		const cs = c.getElementsByTagName(tag);
		for (let i = 0; i < os.length; i += 1) {
			cs[i].style.width = os[i].getBoundingClientRect().width + 'px';
		}
	}
}

function updateScrollBarSize(tab, bar) {
	bar.style.maxWidth = `${tab.clientWidth}px`;
	bar.style.display = 'none';
	const h = parseInt(getScrollBarWidth());
	if (0 < h) bar.style.height = (h + 2) + 'px';
	bar.firstChild.style.width = `${tab.scrollWidth}px`;
}


// ---------------------------------------------------------------------


function onWindowScroll(tab, head, bar) {
	const r = tab.getBoundingClientRect();
	const tabBottom = r.bottom;
	const rh = tab.tHead.getBoundingClientRect();
	const headTop = rh.top, headBottom = rh.bottom;

	const offset = getOffset();
	const headH = tab.tHead.offsetHeight;
	const inView = tabBottom - headTop < CAPABLE_WINDOW_HEIGHT_RATIO * (window.innerHeight - offset);

	let headVisible = false;
	if (inView) {  // do nothing
	} else if (tabBottom - headH < offset) {  // do nothing
	} else if (headTop < offset) {
		headVisible = true;
	}
	let barVisible = false;
	if (inView) {  // do nothing
	} else if (window.innerHeight < headBottom) {  // do nothing
	} else if (tabBottom < window.innerHeight) {  // do nothing
	} else if (tab.scrollWidth - tab.clientWidth > 2) {
		barVisible = true;
	}
	if (head) updateHeaderVisibility(tab, head, headVisible, r.left);
	if (bar) updateScrollBarVisibility(tab, bar, barVisible, r.left);
}

function updateHeaderVisibility(tab, head, visible, tabLeft) {
	if (visible) {
		head.style.top     = getOffset() + 'px';
		head.style.display = 'block';
	} else {
		head.style.display = 'none';
	}
	head.style.left = tabLeft + 'px';
	head.scrollLeft = tab.scrollLeft;
}

function updateScrollBarVisibility(tab, bar, visible, tabLeft) {
	bar.style.display = visible ? 'block' : 'none';
	bar.style.left = tabLeft + 'px';
	bar.scrollLeft = tab.scrollLeft;
}


// ---------------------------------------------------------------------


function onTableScroll(tab, head) {
	const sL = Math.max(0, Math.min(tab.scrollLeft, tab.scrollWidth - tab.offsetWidth));  // for iOS
	if (head) head.scrollLeft = sL;
}


// Utilities ---------------------------------------------------------------


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

function getScrollBarWidth() {
	const d = document.createElement('div');
	d.setAttribute('style', `position:absolute;bottom:100%;width:calc(100vw - 100%);height:1px;`);
	document.body.appendChild(d);
	let width = 0 | window.getComputedStyle(d).getPropertyValue('width');

	if (width === 0) {  // Window does not have any scroll bar
		d.style.overflowY = 'scroll';
		d.style.width = '';
		const c = document.createElement('div');
		c.style.minHeight = '100px';
		d.appendChild(c);
		const cw = 0 | window.getComputedStyle(c).getPropertyValue('width');
		width = d.offsetWidth - cw;
	}
	document.body.removeChild(d);
	return width;
}
