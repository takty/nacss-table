/**
 *
 * Usable View (JS)
 *
 * @author Takuto Yanagida
 * @version 2021-01-18
 *
 */


const SEL_TARGET = '.stile';

const ST_HEADER_CONTAINER = 'fixed-table-header-container';
const ST_HEADER_TABLE     = 'fixed-table-header-table';
const ST_SCROLL_BAR       = 'fixed-table-scroll-bar';

const CAPABLE_WINDOW_HEIGHT_RATIO = 0.9;

let getOffset = () => { return 0; };
let scrollBarWidth;


// -------------------------------------------------------------------------


function initialize(tabs) {
	scrollBarWidth = parseInt(_getScrollBarWidth());
	const conts = [];
	for (let i = 0; i < tabs.length; i += 1) conts.push(new FixedHeaderTable(tabs[i]));
	window.addEventListener('scroll', throttle(() => { for (let i = 0; i < conts.length; i += 1) conts[i].onWindowScroll(); }), { passive: true });
	window.addEventListener('resize', throttle(() => { for (let i = 0; i < conts.length; i += 1) conts[i].onWindowResize(); }), { passive: true });
}

function throttle(fn) {
	let isRunning;
	return () => {
		if (isRunning) return;
		isRunning = true;
		requestAnimationFrame(() => {
			isRunning = false;
			fn();
		});
	};
}

class FixedHeaderTable {

	constructor (tab) {
		this._table        = tab;
		this._headerHeight = 0;
		this._windowWidth  = 0;
		this._create();
		setTimeout(() => { this._initialize(); }, 10);
	}

	_create() {
		this._head = this._createHeaderClone();
		this._sbar = this._createScrollBarClone();
		const caps = this._table.getElementsByTagName('caption');
		this._capt = caps.length ? caps[0] : null;
	}

	_createHeaderClone() {
		let thead = this._table.tHead;
		if (!thead) {
			thead = this._createPseudoHeader();
			if (!thead) return null;
			this._table.tHead = thead;
		}
		const cont = document.createElement('div');
		// NS.addStile(cont, ST_HEADER_CONTAINER);
		cont.dataset.stile += ' ' + ST_HEADER_CONTAINER;
		this._table.parentNode.appendChild(cont);

		const ptab = document.createElement('div');
		// NS.addStile(ptab, ST_HEADER_TABLE);
		ptab.dataset.stile += ' ' + ST_HEADER_TABLE;
		cont.appendChild(ptab);

		const clone = thead.cloneNode(true);
		ptab.appendChild(clone);
		return cont;
	}

	_createPseudoHeader() {
		const tbody = this._table.tBodies[0];
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

		const thead = this._table.createTHead();
		for (let i = 0; i < trsH.length; i += 1) {
			thead.appendChild(trsH[i]);
		}
		return thead;
	}

	_createScrollBarClone() {
		const e = document.createElement('div');
		e.dataset.stile += ' ' + ST_SCROLL_BAR;
		const spacer = document.createElement('div');
		e.appendChild(spacer);
		this._table.parentNode.appendChild(e);
		return e;
	}


	// ---------------------------------------------------------------------


	_initialize() {
		this._initTableScroll();
		this.onWindowResize();
	}

	_initTableScroll() {
		let tableScrollChanged = false;
		let sbarScrollChanged  = false;
		this._table.addEventListener('scroll', throttle(() => {
			if (tableScrollChanged) {
				tableScrollChanged = false;
			} else {
				this._sbar.scrollLeft = this._table.scrollLeft;
				sbarScrollChanged = true;
			}
			this._onTableScroll();
		}));
		this._sbar.addEventListener('scroll', throttle(() => {
			if (sbarScrollChanged) {
				sbarScrollChanged = false;
			} else {
				this._table.scrollLeft = this._sbar.scrollLeft;
				tableScrollChanged = true;
			}
		}));
	}

	_isScrollable() {
		const t = this._table;
		return (t.scrollWidth - t.clientWidth > 2);  // for avoiding needless scrolling
	}


	// ---------------------------------------------------------------------


	onWindowResize() {
		const t = this._table;
		t.style.overflowX = (t.scrollWidth < t.clientWidth + 2) ? 'hidden' : '';
		const ww = Math.min(window.outerWidth, window.innerWidth);  // for iOS
		if (this._windowWidth === ww) return;
		this._windowWidth = ww;

		if (this._head) this._updateHeaderSize(this._head);
		if (this._sbar) this._updateScrollBarSize(this._sbar);
		if (this._head || this._sbar) this.onWindowScroll();
		this._onTableScroll();
	}

	_updateHeaderSize(cont) {
		cont.style.maxWidth = this._table.getBoundingClientRect().width + 'px';
		cont.style.display = 'none';
		cont.style.top = getOffset() + 'px';

		const thead = this._table.tHead;
		let w = thead.getBoundingClientRect().width;
		const ptab = cont.firstChild;
		ptab.style.width = w + 'px';

		const clone = ptab.firstChild;

		const oTrs = thead.rows;
		const cTrs = clone.rows;
		for (let i = 0; i < oTrs.length; i += 1) {
			copyWidth(oTrs[i], cTrs[i], 'td');
			copyWidth(oTrs[i], cTrs[i], 'th');
		}
		this._headerHeight = thead.getBoundingClientRect().height;
		function copyWidth(o, c, tag) {
			const os = o.getElementsByTagName(tag);
			const cs = c.getElementsByTagName(tag);
			for (let i = 0; i < os.length; i += 1) {
				cs[i].style.width = os[i].getBoundingClientRect().width + 'px';
			}
		}
	}

	_updateScrollBarSize(b) {
		b.style.maxWidth = `${this._table.clientWidth}px`;
		b.style.display = 'none';
		const h = parseInt(_getScrollBarWidth());
		if (0 < h) b.style.height = (h + 2) + 'px';
		b.firstChild.style.width = `${this._table.scrollWidth}px`;
	}


	// ---------------------------------------------------------------------


	onWindowScroll() {
		const tr     = this._table.getBoundingClientRect();
		const tabTop = tr.top, tabBottom = tr.bottom;
		const offset = getOffset();
		const capH   = this._capt ? this._capt.offsetHeight : 0;
		const headH  = this._headerHeight;
		const inView = tabBottom - tabTop - capH < CAPABLE_WINDOW_HEIGHT_RATIO * (window.innerHeight - offset);

		let headVisible = false;
		if (inView) {  // do nothing
		} else if (offset < tabTop + capH) {  // do nothing
		} else if (tabBottom - headH < offset) {  // do nothing
		} else if (tabTop + capH < offset) {
			headVisible = true;
		}
		let sbarVisible = false;
		if (inView) {  // do nothing
		} else if (window.innerHeight < tabTop + capH + headH) {  // do nothing
		} else if (tabBottom < window.innerHeight) {  // do nothing
		} else if (this._isScrollable()) {
			sbarVisible = true;
		}
		if (this._head) this.updateHeaderVisibility(headVisible, tr.left);
		if (this._sbar) this.updateScrollBarVisibility(sbarVisible, tr.left);
	}

	updateHeaderVisibility(visible, tabLeft) {
		const head = this._head;
		if (visible) {
			head.style.top     = getOffset() + 'px';
			head.style.display = 'block';
		} else {
			head.style.display = 'none';
		}
		head.style.left = tabLeft + 'px';
		head.scrollLeft = this._table.scrollLeft;
	}

	updateScrollBarVisibility(visible, tabLeft) {
		const b = this._sbar;
		b.style.display = visible ? 'block' : 'none';
		b.style.left = tabLeft + 'px';
		b.scrollLeft = this._table.scrollLeft;
	}


	// ---------------------------------------------------------------------


	_onTableScroll() {
		const tab = this._table, head = this._head;
		const sL = Math.max(0, Math.min(tab.scrollLeft, tab.scrollWidth - tab.offsetWidth));  // for iOS
		if (head) head.scrollLeft = sL;
	}

}


// Utilities ---------------------------------------------------------------


function _getScrollBarWidth() {
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
