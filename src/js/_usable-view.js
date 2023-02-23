/**
 * Usable View
 *
 * @author Takuto Yanagida
 * @version 2023-02-23
 */

function apply(tabs, opts = {}) {
	if (tabs.length === 0) return;
	const cm = Object.assign({
		capableWindowHeightRate: 0.9,
		styleHeaderContainer   : ':ncTableStickyHeaderContainer',
		styleHeaderTable       : ':ncTableStickyHeaderTable',
		styleScrollBar         : ':ncTableStickyScrollBar',

		styleScrollRight: ':ncScrollRight',
		styleScrollLeft : ':ncScrollLeft',
		offset          : 0,
	}, opts);

	const cs = [], ts = [...tabs];
	for (const tab of ts) {
		const head = _createHeaderClone(tab, cm);
		const bar  = _createBarClone(tab, cm);
		cs.push({ tab, head, bar });

		let forced = null;
		const el = (self, op) => throttle(() => {
			if (forced && forced !== self) {
				forced = null;
			} else {
				forced = self;
				op.scrollLeft = self.scrollLeft;
				if (head) onTableScroll(tab, head, cm);
			}
		});
		tab.addEventListener('scroll', el(tab, bar));
		bar.addEventListener('scroll', el(bar, tab));
	}
	const ro = new ResizeObserver((es) => {
		for (const e of es) {
			const idx = ts.indexOf(e.target);
			const c = cs[idx];
			doResize(e.contentRect, c.tab, c.head, c.bar, cm);
		}
	});
	for (const t of ts) ro.observe(t);

	window.addEventListener('scroll', throttle(() => {
		for (const c of cs) onWindowScroll(c.tab, c.head, c.bar, cm);
	}), { passive: true });

	initializeScrollPaddingTop();

	let st = null;
	const fn = () => {
		cm.offset = getScrollPaddingTop('nacss-table');
		if (st) clearTimeout(st);
		st = setTimeout(() => {
			for (const c of cs) doResize(null, c.tab, c.head, c.bar, cm);
		}, 100);
	};
	onResize(fn, true);
	const mo = new MutationObserver(fn);
	mo.observe(document.documentElement, { attributes: true });
}

function _createHeaderClone(tab, cm) {
	let thead = tab.tHead;
	if (!thead) {
		thead = _createPseudoHeader(tab);
		if (!thead) return null;
		tab.tHead = thead;
	}
	const hc = document.createElement('div');
	setClass(hc, cm.styleHeaderContainer);
	tab.parentNode.appendChild(hc);

	const ht = document.createElement('div');
	setClass(ht, cm.styleHeaderTable);
	hc.appendChild(ht);

	ht.appendChild(thead.cloneNode(true));
	return hc;
}

function _createPseudoHeader(tab) {
	const trs = tab.tBodies[0].rows;
	if (trs.length === 0) return null;

	function containsOnlyTh(tr) {
		const tds = tr.getElementsByTagName('td');
		const ths = tr.getElementsByTagName('th');
		if (tds.length === 0 && ths.length > 0) return true;
		return false;
	}
	const trsH = [];
	for (const tr of trs) {
		if (!containsOnlyTh(tr)) break;
		trsH.push(tr);
	}
	if (trsH.length === 0) return null;

	const thead = tab.createTHead();
	for (const tr of trsH) thead.appendChild(tr);
	return thead;
}

function _createBarClone(tab, cm) {
	const bar = document.createElement('div');
	setClass(bar, cm.styleScrollBar);
	const spacer = document.createElement('div');
	bar.appendChild(spacer);
	tab.parentNode.appendChild(bar);
	return bar;
}


// ---------------------------------------------------------------------


function doResize(r, tab, head, bar, cm) {
	tab.style.overflowX = (tab.scrollWidth < tab.clientWidth + 2) ? 'hidden' : null;

	if (head) _updateHeaderSize(r, tab, head, cm);
	if (bar) _updateScrollBarSize(tab, bar);
	if (head || bar) onWindowScroll(tab, head, bar, cm);
	if (head) onTableScroll(tab, head, cm);
}

function _updateHeaderSize(r, tab, head, cm) {
	const tw = r ? r.width : tab.offsetWidth;
	head.style.maxWidth = tw + 'px';
	head.style.display  = 'none';
	head.style.top      = cm.offset + 'px';

	const thead = tab.tHead;
	const ht    = head.firstChild;

	head.style.setProperty('--nc-width', `${thead.offsetWidth}px`);
	head.style.setProperty('--nc-height', `${thead.offsetHeight}px`);

	const oTrs = thead.rows;
	const cTrs = ht.firstChild.rows;
	for (let i = 0; i < oTrs.length; i += 1) {
		copyWidth(oTrs[i], cTrs[i], 'td');
		copyWidth(oTrs[i], cTrs[i], 'th');
	}
	function copyWidth(o, c, tag) {
		const os = o.getElementsByTagName(tag);
		const cs = c.getElementsByTagName(tag);
		for (let i = 0; i < os.length; i += 1) {
			cs[i].style.width = os[i].offsetWidth + 'px';
		}
	}
}

function _updateScrollBarSize(tab, bar) {
	const disabled = (tab.scrollWidth < tab.clientWidth + 2);
	bar.style.overflowX     = disabled ? 'hidden' : null;
	bar.style.pointerEvents = disabled ? 'none'   : null;

	bar.style.maxWidth = `${tab.clientWidth}px`;
	bar.style.display = 'none';
	const h = parseInt(getScrollBarWidth(document.documentElement));
	if (0 < h) bar.style.height = (h + 2) + 'px';
	bar.firstChild.style.width = `${tab.scrollWidth}px`;
}


// ---------------------------------------------------------------------


function onWindowScroll(tab, head, bar, cm) {
	const r = tab.getBoundingClientRect();
	const tBottom = r.bottom;
	const rh = (tab.tHead ?? tab.tBodies[0]).getBoundingClientRect();
	const hTop = rh.top, hBottom = rh.bottom;
	const wY0 = cm.offset, wY1 = window.innerHeight;

	const inView = tBottom - hTop < cm.capableWindowHeightRate * (wY1 - wY0);
	const tLeft = r.left, tScrollLeft = tab.scrollLeft;
	if (head) {
		const hCy = tab.tHead.offsetHeight;
		const f = (!inView && hTop < wY0 && wY0 < tBottom - hCy);
		_updateHeaderVisibility(head, f, tLeft, tScrollLeft);
	}
	if (bar) {
		const f = (!inView && hBottom < wY1 && wY1 < tBottom);
		_updateBarVisibility(bar, f, tLeft, tScrollLeft);
	}
}

function _updateHeaderVisibility(head, visible, tabLeft, tabScrollLeft) {
	head.style.display = visible ? 'block' : 'none';
	head.style.left    = tabLeft + 'px';
	head.scrollLeft    = tabScrollLeft;

	const h = head.offsetHeight;
	setScrollPaddingTop('nacss-table', h);
}

function _updateBarVisibility(bar, visible, tabLeft, tabScrollLeft) {
	bar.style.display = visible ? 'block' : 'none';
	bar.style.left    = tabLeft + 'px';
	bar.scrollLeft    = tabScrollLeft;
}


// ---------------------------------------------------------------------


function onTableScroll(tab, head, cm) {
	const sL = Math.max(0, Math.min(tab.scrollLeft, tab.scrollWidth - tab.offsetWidth));  // for iOS
	head.scrollLeft = sL;

	if (tab.scrollWidth - tab.clientWidth > 2) {  // for avoiding needless scrolling
		const r = tab.scrollLeft / (tab.scrollWidth - tab.clientWidth);
		setClass(head, cm.styleScrollRight, r < 0.95);
		setClass(head, cm.styleScrollLeft, 0.05 < r);
	} else {
		setClass(head, cm.styleScrollRight, false);
		setClass(head, cm.styleScrollLeft, false);
	}
}


// Utilities ---------------------------------------------------------------


function getScrollBarWidth(parent) {
	const d = document.createElement('div');
	d.setAttribute('style', 'position:absolute;bottom:100%;width:calc(100vw - 100%);height:1px;');
	parent.appendChild(d);
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
	parent.removeChild(d);
	return width;
}