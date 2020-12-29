/* eslint-disable no-underscore-dangle */
/**
 *
 * Table Style - Fixed Header (JS)
 *
 * @author Takuto Yanagida
 * @version 2019-10-28
 *
 */


window.ST = window['ST'] || {};


(function (NS) {

	const SEL_TARGET = '.stile';

	const ST_HEADER_CONTAINER = 'fixed-table-header-container';
	const ST_HEADER_TABLE     = 'fixed-table-header-table';
	const ST_SCROLL_BAR       = 'fixed-table-scroll-bar';
	const ST_ENLARGER_BUTTON  = 'enlarger-button';
	const ST_TABLE_SHADE      = 'table-shade';
	const ST_STATE_ENLARGED   = 'table-enlarged';
	const ST_OPT_NO_ENLARGER  = 'no-enlarger';

	const CAPABLE_WINDOW_HEIGHT_RATIO = 0.9;
	const ENLARGER_WINDOW_WIDTH_RATIO = 0.9;

	let getOffset;
	let scrollBarWidth;

	// NS.addInit(4, () => {
	// 	getOffset = NS.makeOffsetFunction(false, true);  // Initialize here

	// 	const tabs = document.querySelectorAll(SEL_TARGET + ' table:not([class])');
	// 	setTimeout(() => { initialize(tabs); }, 0);  // Delay for IE11
	// });


	// -------------------------------------------------------------------------


	function initialize(tabs) {
		scrollBarWidth = parseInt(_getScrollBarWidth());
		const conts = [];
		for (let i = 0; i < tabs.length; i += 1) conts.push(new FixedHeaderTable(tabs[i]));
		NS.onScroll(() => { for (let i = 0; i < conts.length; i += 1) conts[i].onWindowScroll(); });
		NS.onResize(() => { for (let i = 0; i < conts.length; i += 1) conts[i].onWindowResize(); });
	}

	class FixedHeaderTable {

		constructor (tab) {
			if (tab.style.height) tab.style.height = '';
			this._table        = tab;
			this._headerHeight = 0;
			this._isEnlarged   = false;
			this._windowWidth  = Math.min(window.outerWidth, window.innerWidth);  // for iOS
			this._create();
			setTimeout(() => { this._initialize(); }, 10);
		}

		_create() {
			this._head = this._createHeaderClone();
			this._sbar = this._createScrollBarClone();
			this._ebtn = NS.containStile(this._table, ST_OPT_NO_ENLARGER) ? null : this._createEnlargerButton();
			this._shade = this._createShade();

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
			NS.addStile(cont, ST_HEADER_CONTAINER);
			this._table.parentNode.appendChild(cont);

			const ptab = document.createElement('div');
			NS.addStile(ptab, ST_HEADER_TABLE);
			cont.appendChild(ptab);

			const clone = thead.cloneNode(true);
			ptab.appendChild(clone);

			if (NS.containStile(this._table, ST_STATE_ENLARGED)) NS.addStile(cont, ST_STATE_ENLARGED);
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
			const sbar = document.createElement('div');
			NS.addStile(sbar, ST_SCROLL_BAR);
			this._table.parentNode.appendChild(sbar);
			const spacer = document.createElement('div');
			sbar.appendChild(spacer);
			return sbar;
		}

		_createEnlargerButton() {
			const ebtn = document.createElement('div');
			ebtn.dataset['stile'] = ST_ENLARGER_BUTTON;
			this._table.appendChild(ebtn);
			return ebtn;
		}

		_createShade() {
			const shade = document.createElement('div');
			shade.dataset['stile'] = ST_TABLE_SHADE;
			this._table.appendChild(shade);
			return shade;
		}


		// ---------------------------------------------------------------------


		_initialize() {
			const bg = getComputedStyle(this._table).backgroundColor;
			if (bg && bg !== 'transparent') this._table.dataset['background'] = bg;

			this._initTableScroll();
			if (this._ebtn) {
				this._ebtn.addEventListener('click', () => {
					if (this._isEnlarged) this._turnOffEnlarged();
					else this._turnOnEnlarged();
				});
				if (!this._isEnlargable()) this._ebtn.style.display = 'none';
			}
			this._resize();
			this._adjustUnexpectedScrollBar()
		}

		_initTableScroll() {
			let tableScrollChanged = false;
			let sbarScrollChanged  = false;
			this._table.addEventListener('scroll', NS.throttle(() => {
				if (tableScrollChanged) {
					tableScrollChanged = false;
				} else {
					this._sbar.scrollLeft = this._table.scrollLeft;
					sbarScrollChanged = true;
				}
				this._onTableScroll();
			}));
			this._sbar.addEventListener('scroll', NS.throttle(() => {
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

		_isEnlargable() {
			const t = this._table;
			const ww = Math.min(window.outerWidth, window.innerWidth);  // for iOS
			return (t.scrollWidth - t.offsetWidth > 1 && t.offsetWidth < ENLARGER_WINDOW_WIDTH_RATIO * ww);  // for avoiding needless scrolling
		}

		_turnOnEnlarged() {
			const tab = this._table;
			if (tab.scrollWidth - tab.offsetWidth <= 1) return;

			tab.scrollLeft  = 0;
			tab.style.width = 'calc(100vw - ' + scrollBarWidth + 'px)';
			NS.addStile(tab, ST_STATE_ENLARGED);
			if (this._head) NS.addStile(this._head, ST_STATE_ENLARGED);
			this._isEnlarged = true;

			// Do this timing!
			let left = tab.getBoundingClientRect().left + window.pageXOffset;
			const tbody = tab.tBodies[0];
			const width = tbody.clientWidth, pwidth = this._windowWidth - scrollBarWidth;
			if (width < pwidth) left -= (pwidth - width) / 2;
			tab.style.marginLeft = -left + 'px';

			tab.style.background = null;
			this._resize();
		}

		_turnOffEnlarged() {
			const tab = this._table;
			tab.style.marginLeft = '';
			tab.style.width      = '';
			tab.scrollLeft       = 0;
			NS.removeStile(tab, ST_STATE_ENLARGED);
			if (this._head) NS.removeStile(this._head, ST_STATE_ENLARGED);
			this._isEnlarged = false;

			NS.removeStile(this._shade, 'visible');
			this._shade.style.background = null;
			this._resize();
		}


		// ---------------------------------------------------------------------


		onWindowResize() {
			this._adjustUnexpectedScrollBar();
			const ww = Math.min(window.outerWidth, window.innerWidth);  // for iOS
			if (this._windowWidth === ww) return;
			this._windowWidth = ww;

			if (this._isEnlarged) {
				this._turnOffEnlarged();
			} else {
				this._resize();
			}
		}

		_adjustUnexpectedScrollBar() {
			const t = this._table;
			t.style.overflowX = (t.scrollWidth < t.clientWidth + 2) ? 'hidden' : '';
		}

		_resize() {
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

		_updateScrollBarSize(sbar) {
			sbar.style.maxWidth = this._table.clientWidth + 'px';
			sbar.style.display = 'none';
			const h = parseInt(_getScrollBarWidth());
			if (0 < h) sbar.style.height = (h + 2) + 'px';

			const tbody = this._table.tBodies[0];
			const spacer = sbar.firstChild;
			spacer.style.width = Math.ceil(tbody.clientWidth) + 'px';
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
				if (this._ebtn && head) this.switchEnlargerToFloatingHeader();
			} else {
				head.style.display = 'none';
				if (this._ebtn && head) this.switchEnlargerToTable();
			}
			head.style.left = tabLeft + 'px';
			head.scrollLeft = this._table.scrollLeft;
		}

		switchEnlargerToTable() {
			this._ebtn.parentNode.removeChild(this._ebtn);
			this._ebtn.style.top = this._capt ? (this._capt.offsetHeight + 'px') : 0;
			this._table.appendChild(this._ebtn);
		}

		switchEnlargerToFloatingHeader() {
			this._ebtn.parentNode.removeChild(this._ebtn);
			this._ebtn.style.top = 0;
			this._head.appendChild(this._ebtn);
		}

		updateScrollBarVisibility(visible, tabLeft) {
			const sbar = this._sbar;
			if (visible) {
				sbar.style.display = 'block';
			} else {
				sbar.style.display = 'none';
			}
			sbar.style.left = tabLeft + 'px';
			sbar.scrollLeft = this._table.scrollLeft;
		}


		// ---------------------------------------------------------------------


		_onTableScroll() {
			const tab = this._table, head = this._head, capt = this._capt, ebtn = this._ebtn, shade = this._shade;
			const sL = Math.max(0, Math.min(tab.scrollLeft, tab.scrollWidth - tab.offsetWidth));  // for iOS
			if (head) head.scrollLeft = sL;
			if (capt) {
				if (this._isScrollable()) {
					if (this._stCapt) clearTimeout(this._stCapt);
					this._stCapt = setTimeout(() => { capt.style.transform = `translateX(${sL}px)`; }, 200);
				} else {
					capt.style.transform = null;
				}
			}
			if (ebtn) {
				NS.removeStile(ebtn, 'visible');
				if (this._stEbtn) clearTimeout(this._stEbtn);
				this._stEbtn = setTimeout(() => { NS.addStile(ebtn, 'visible'); }, 100);
				this._updateEnlager();
			}

			if (this._isEnlarged) {
				NS.removeStile(shade, 'visible');
				if (this._isScrollable() && this._isEnlarged) {
					if (this._stShade) clearTimeout(this._stShade);
					this._stShade = setTimeout(() => {
						shade.style.transform = `translateX(${sL}px)`;
						NS.addStile(shade, 'visible');
					}, 100);
				}
			}
			this._updateShade();
		}

		_updateEnlager() {
			const tab = this._table, capt = this._capt, ebtn = this._ebtn;
			const sL = tab.scrollLeft;

			const tbody = this._table.tBodies[0];
			const scrW = tbody.clientWidth, cltW = tab.clientWidth;
			if (this._isEnlargable() || this._isEnlarged) {
				let etbRight = -Math.min(scrW - cltW, sL);  // for Mobile Safari
				if (!this._isEnlargable() && this._isEnlarged) {
					const diff = ebtn.parentElement.clientWidth - scrW;
					if (0 < diff) etbRight = diff;
				}
				if (ebtn.parentNode === tab) ebtn.style.top = capt ? (capt.offsetHeight + 'px') : 0;
				ebtn.style.right = etbRight + 'px';
				ebtn.style.display = 'block';
			} else {
				ebtn.style.display = 'none';
			}
		}

		_updateShade() {
			const tab = this._table, shade = this._shade;
			if (this._isScrollable()) {
				const s = this._calcShadeStyle();
				if (this._isEnlarged) {
					shade.style.background = s;
				} else {
					tab.style.background = s;
				}
			} else {
				tab.style.background = '';  // This must be '' for IE11
			}
		}

		_calcShadeStyle() {
			const tab = this._table;
			const r = tab.scrollLeft / (tab.scrollWidth - tab.clientWidth);
			let rl = 0.25, rr = 0.25;
			if (r < 0.1) rl *= r / 0.1;
			if (0.9 < r) rr *= (1 - r) / 0.1;
			const ch = this._capt ? (this._capt.offsetHeight + 'px') : '0';
			const sl = `linear-gradient(to left, rgba(0,0,0,0), rgba(0,0,0,${rl}) 1.25rem) 0 ${ch} / 1.25rem 100% no-repeat scroll`;
			const sr = `linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,${rr}) 1.25rem) right ${ch} / 1.25rem 100% no-repeat scroll`;

			const bg = this._table.dataset['background'];
			const sb = (this._isEnlarged || !bg || bg === 'transparent') ? '' : `, linear-gradient(to bottom, ${bg}, ${bg}) 0px 0px / 100% 100% no-repeat`;
			return sl + ',' + sr + sb;
		}

	}


	// Utilities ---------------------------------------------------------------


	function _getScrollBarWidth() {
		const dummy = document.createElement('div');
		dummy.style.bottom = '100%';
		dummy.style.height = '1px';
		dummy.style.position = 'absolute';
		dummy.style.width = 'calc(100vw - 100%)';
		document.body.appendChild(dummy);
		let width = 0 | window.getComputedStyle(dummy, '').getPropertyValue('width');

		if (width === 0) {  // Window does not have any scroll bar
			dummy.style.overflowY = 'scroll';
			dummy.style.width = '';
			const c = document.createElement('div');
			c.style.minHeight = '100px';
			dummy.appendChild(c);
			const cw = 0 | window.getComputedStyle(c, '').getPropertyValue('width');
			width = dummy.offsetWidth - cw;
		}
		document.body.removeChild(dummy);
		return width;
	}

})(window.ST);
