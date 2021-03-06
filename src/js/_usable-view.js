/**
 *
 * Usable View
 *
 * @author Takuto Yanagida
 * @version 2021-01-25
 *
 */


function initialize(tabs, opts = {}) {
	if (tabs.length === 0) return;
	const cm = Object.assign({
		capableWindowHeightRate: 0.9,
		styleHeaderContainer   : ':ncTableFixedHeaderContainer',
		styleHeaderTable       : ':ncTableFixedHeaderTable',
		styleScrollBar         : ':ncTableFixedScrollBar',

		styleFixedHeader       : ':ncFixedHeader',
		styleScrollRight       : ':ncScrollRight',
		styleScrollLeft        : ':ncScrollLeft',
		offset                 : 0,
	}, opts);

	const cs = [], ts = [...tabs];
	for (const tab of ts) {
		const head = _createHeaderClone(tab, cm);
		const bar  = _createBarClone(tab, cm);
		cs.push({ tab, head, bar });

		let forced = false;
		const el = (tar, op) => throttle(() => {
			if (forced) {
				forced = false;
			} else {
				forced = true;
				op.scrollLeft = tar.scrollLeft;
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
			onResize(e.contentRect, c.tab, c.head, c.bar, cm);
		}
	});
	for (const t of ts) ro.observe(t);

	window.addEventListener('scroll', throttle(() => {
		for (const c of cs) onWindowScroll(c.tab, c.head, c.bar, cm);
	}), { passive: true });

	const sel = getSelector(cm.styleFixedHeader);
	if (sel) {
		const elm = document.querySelector(sel);
		if (elm) {
			const rob = new ResizeObserver(es => {
				cm.offset = es[0].contentRect.bottom;
				for (const c of cs) onResize(null, c.tab, c.head, c.bar, cm);
			});
			rob.observe(elm);
		}
	}
}

function _createHeaderClone(tab, cm) {
	let thead = tab.tHead;
	if (!thead) {
		thead = _createPseudoHeader(tab);
		if (!thead) return null;
		tab.tHead = thead;
	}
	const hc = document.createElement('div');
	enableClass(true, hc, cm.styleHeaderContainer);
	tab.parentNode.appendChild(hc);

	const ht = document.createElement('div');
	enableClass(true, ht, cm.styleHeaderTable);
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
	enableClass(true, bar, cm.styleScrollBar);
	const spacer = document.createElement('div');
	bar.appendChild(spacer);
	tab.parentNode.appendChild(bar);
	return bar;
}


// ---------------------------------------------------------------------


function onResize(r, tab, head, bar, cm) {
	tab.style.overflowX = (tab.scrollWidth < tab.clientWidth + 2) ? 'hidden' : null;

	if (head) _updateHeaderSize(r, tab, head, cm);
	if (bar) _updateScrollBarSize(tab, bar);
	if (head || bar) onWindowScroll(tab, head, bar, cm);
	if (head) onTableScroll(tab, head, cm);
}

function _updateHeaderSize(r, tab, head, cm) {
	const tw = r ? r.width : tab.getBoundingClientRect().width;
	head.style.maxWidth = tw + 'px';
	head.style.display  = 'none';
	head.style.top      = cm.offset + 'px';

	const thead = tab.tHead;
	const hw = thead.getBoundingClientRect().width;
	const ht = head.firstChild;
	ht.style.width = hw + 'px';

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
			cs[i].style.width = os[i].getBoundingClientRect().width + 'px';
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
	const rh = tab.tHead.getBoundingClientRect();
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
		enableClass(r < 0.95, head, cm.styleScrollRight);
		enableClass(0.05 < r, head, cm.styleScrollLeft);
	} else {
		enableClass(false, head, cm.styleScrollRight);
		enableClass(false, head, cm.styleScrollLeft);
	}
}


// Utilities ---------------------------------------------------------------


function getSelector(cls) {
	if (cls.startsWith(':')) {
		return `*[data-${cls.substr(1).replace(/([A-Z])/g, c => '-' + c.charAt(0).toLowerCase())}]`;
	} else {
		return `*${cls}`;
	}
}

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