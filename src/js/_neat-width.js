/**
 * Neat Width
 *
 * @author Takuto Yanagida
 * @version 2023-01-17
 */

function apply(tabs, opts = {}) {
	if (tabs.length === 0) return;

	const lt = tabs[tabs.length - 1];
	const cm = Object.assign({
		fullWidthRate   : 0.95,
		cellMinWidth    : 80,
		cellMinAspect   : 2 / 3,  // width / height
		cellMinLength   : 8,
		maxRowSize      : 200,
		maxBorderWidth  : 2,
		before          : null,  // function (table) { ...; return delay; }
		after           : null,  // function (table) { ... }
		styleNeat       : ':ncTableNeat',
		styleFull       : ':ncTableFull',
		styleScrollRight: ':ncScrollRight',
		styleScrollLeft : ':ncScrollLeft',
	}, opts, getCommonMetrics(lt));

	cm.padH += cm.maxBorderWidth * 2;
	cm.padV += cm.maxBorderWidth * 2;
	cm.dcTd = makeDummyCell(lt, 'td');
	cm.dcTh = makeDummyCell(lt, 'th');

	const tarTabs = [], noTarTabs = [];
	for (const t of tabs) {
		if (isTarget(t, cm)) tarTabs.push(t);
		else noTarTabs.push(t);
	}
	cm.gcCount = tarTabs.length;

	for (const t of tarTabs) {
		const delay = (cm.before) ? (cm.before(t) ?? 0) : false;
		st(() => {
			adjustWidth(t, cm);
			setClass(t, cm.styleNeat);
			if (cm.after) cm.after(t);
			if (--cm.gcCount === 0) removeDummyCell(lt, cm);
		}, delay);
	}
	if (cm.fullWidthRate) {
		for (const t of noTarTabs) {
			const pw = t.parentElement.clientWidth;
			if (pw * cm.fullWidthRate < t.clientWidth) setClass(t, cm.styleFull);
		}
	}
	function st(fn, d) { (d === false) ? fn() : setTimeout(fn, d); }
	initScroll(tarTabs, cm);
}

function getCommonMetrics(tab) {
	const td = tab.getElementsByTagName('td')[0];
	const s = getComputedStyle(td);
	const padH  = parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
	const padV  = parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
	const [charW, lineH] = getTextSize(td);
	return { padH, padV, charW, lineH };
}

function getTextSize(elm) {
	const d = document.createElement(elm.nodeName);
	d.setAttribute('style', `position:fixed;margin:0;padding:0;font-family:${elm.style.fontFamily || 'inherit'};font-size:${elm.style.fontSize || 'inherit'};`);
	d.innerHTML = '\u3000';  // Full width space
	elm.parentNode.appendChild(d);
	const w = d.clientWidth;
	const h = d.clientHeight;
	d.parentNode.removeChild(d);
	return [w, h];
}

function makeDummyCell(t, tagName) {
	const d = document.createElement(tagName);
	d.setAttribute('style', `position:fixed;display:inline-block;visibility:hidden;white-space:nowrap;`);
	return t.appendChild(d);
}

function removeDummyCell(lt, cMat) {
	lt.removeChild(cMat.dcTd);
	lt.removeChild(cMat.dcTh);
}

function isTarget(tab, cMet) {
	if (tab.rows.length === 0) return false;
	if (cMet.maxRowSize < tab.rows.length) return false;

	const { cellMinWidth, cellMinAspect } = cMet;
	for (const tr of tab.rows) {
		if (!tr.hasChildNodes()) continue;
		for (const n of tr.childNodes) {
			const tn = n.tagName;
			if (tn !== 'TD' && tn !== 'TH') continue;
			if (1 < parseInt(n.getAttribute('colSpan'), 10)) continue;
			if (1 < parseInt(n.getAttribute('rowSpan'), 10)) continue;
			const cw = n.clientWidth;
			const ch = n.clientHeight;
			if (cw < cellMinWidth || cw / ch < cellMinAspect) return true;
		}
	}
	return false;
}


// -------------------------------------------------------------------------


function initScroll(tabs, cMet) {
	const rob = new ResizeObserver(oes => {
		for (const oe of oes) {
			onResize(oe.target);
			onScroll(oe.target, cMet);
		}
	});
	for (const t of tabs) {
		rob.observe(t);
		t.addEventListener('scroll', throttle(() => { onScroll(t, cMet); }));
	}
}

function onResize(tab) {
	const th = tab.clientHeight;
	const ch = tab.caption?.clientHeight ?? 0;
	tab.style.setProperty('--nc-height', `${th - ch}px`)
}

function onScroll(tab, cMet) {
	if (tab.scrollWidth - tab.clientWidth > 2) {  // for avoiding needless scrolling
		const r = tab.scrollLeft / (tab.scrollWidth - tab.clientWidth);
		setClass(tab, cMet.styleScrollRight, r < 0.95);
		setClass(tab, cMet.styleScrollLeft, 0.05 < r);
	} else {
		setClass(tab, cMet.styleScrollRight, false);
		setClass(tab, cMet.styleScrollLeft, false);
	}
}


// -------------------------------------------------------------------------


function adjustWidth(tab, cMet) {
	tab.removeAttribute('width');
	if (tab.style.width) tab.style.width = null;
	if (tab.style.height) tab.style.height = null;

	const grid  = makeCellGrid(tab);
	const met   = Object.assign(getMetrics(tab, grid), cMet);
	const newWs = calcNewWidths(grid, met);
	setCellWidth(grid, newWs);

	const cs = tab.getElementsByTagName('caption');
	if (cs.length) cs[0].innerHTML = `<span>${cs[0].innerHTML}</span>`;
}


// -------------------------------------------------------------------------


function makeCellGrid(t) {
	const css = collectCells(t);
	let maxWidth = 0;
	for (const cs of css) maxWidth = Math.max(maxWidth, cs.length);
	const g = [];
	for (const cs of css) g.push(new Array(maxWidth));

	for (let y = 0; y < g.length; y += 1) {
		const gr = g[y];
		const tds = css[y];
		let i = 0;

		for (let x = 0; x < maxWidth; x += 1) {
			if (typeof gr[x] === 'number' || gr[x] === null) continue;

			const td = tds[i]
			const col = parseInt(td.getAttribute('colSpan') ?? 1, 10);
			const row = parseInt(td.getAttribute('rowSpan') ?? 1, 10);
			gr[x] = td;

			if (1 < col) {
				for (let p = 1; p < col; p += 1) gr[x + p] = p;
			}
			if (1 < row) {
				for (let q = 1; q < row; q += 1) {
					const nr = g[y + q];
					for (let p = 0; p < col; p += 1) nr[x + p] = null;
				}
			}
			i += 1;
			if (tds.length <= i) break;
		}
	}
	return g;
}

function collectCells(t, css = []) {
	for (const tr of t.rows) {
		const cs = [];
		if (tr.hasChildNodes()) {
			for (const n of tr.childNodes) {
				const tn = n.tagName;
				if (tn === 'TD' || tn === 'TH') cs.push(n);
			}
		}
		css.push(cs);
	}
	return css;
}


// -------------------------------------------------------------------------


function getMetrics(tab, grid) {
	const origTabW = tab.clientWidth;
	const origCellWs = [];
	for (let x = 0; x < grid[0].length; x += 1) {
		for (let y = 0; y < grid.length; y += 1) {
			const g = grid[y][x];
			if (g instanceof HTMLTableCellElement && !g.getAttribute('colSpan')) {
				origCellWs.push(g.clientWidth);
				break;
			}
		}
	}
	return { origTabW, origCellWs };
}


// -------------------------------------------------------------------------


function calcNewWidths(grid, met) {
	for (const gr of grid) {
		for (const gc of gr) {
			if (typeof gc !== 'number' && gc !== null) gc.style.whiteSpace = 'nowrap';
		}
	}
	const gw = grid[0].length;
	const newWs = new Array(gw).fill(0);
	const fixWs = new Array(gw).fill(0);

	for (const gr of grid) {
		for (let x = 0; x < gw; x += 1) {
			const td = gr[x];
			if (td === undefined || td === null || typeof td === 'number') continue;
			if (x < gw - 1 && typeof gr[x + 1] === 'number') continue;
			if (1 < parseInt(td.getAttribute('colSpan'), 10)) continue;
			if (1 < parseInt(td.getAttribute('rowSpan'), 10)) continue;

			const minW = calcMinWidth(td, met);
			newWs[x] = Math.max(newWs[x], minW);
			if (!minW) fixWs[x] = Math.max(fixWs[x], td.clientWidth);
		}
	}
	widenTabWidth(newWs, fixWs, met);
	return newWs;
}

function calcMinWidth(td, met) {
	const { padH, padV, charW, lineH, dcTd, dcTh, cellMinWidth, cellMinAspect, cellMinLength } = met;
	if (calcMaxLineLength(td) < cellMinLength) return 0;

	td.innerHTML = td.innerHTML.trim();
	const dc = td.tagName === 'TD' ? dcTd : dcTh;
	dc.innerHTML = td.innerHTML;
	const aw = dc.clientWidth - padH;
	const ls = Math.round((dc.clientHeight - padV) / lineH);
	let minW = 0;
	for (let i = 2;; i += 1) {
		const tempW = 0 | (aw / i + charW * i + padH);
		const tempH = ls * (i * lineH) + padV;
		if (tempW < cellMinWidth || tempW / tempH < cellMinAspect || (minW && minW < tempW)) break;
		minW = tempW;
	}
	return (minW + charW < dc.clientWidth) ? minW : 0;
}

function calcMaxLineLength(td) {
	const ih = td.innerHTML.trim();
	const ls = ih.split(/<\s*br\s*\/?>/ui);
	const ts = ls.map(e => e.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '').length);
	return Math.max(...ts);
}

function widenTabWidth(newWs, fixWs, met) {
	const { origTabW, origCellWs } = met;
	let wNew = 0, wFix = 0;
	for (let i = 0; i < newWs.length; i += 1) {
		if (newWs[i]) {
			wNew += newWs[i];
		} else {
			wFix += fixWs[i];
		}
	}
	if (origTabW < wNew + wFix) return;
	let rem = origTabW - wFix;
	for (let i = 0; i < newWs.length; i += 1) {
		if (!newWs[i]) continue;
		const nw = newWs[i];
		const w = Math.min(nw / wNew * rem, origCellWs[i]);
		rem  -= (w - nw);
		wNew -= (w - nw);
		newWs[i] = 0 | w;
	}
}


// -------------------------------------------------------------------------


function setCellWidth(grid, ws) {
	for (const gr of grid) {
		for (let x = 0; x < gr.length; x += 1) {
			const gc = gr[x], w = ws[x];
			if (!w || !(gc instanceof HTMLTableCellElement)) continue;
			gc.style.whiteSpace = null;
			gc.style.minWidth   = w + 'px';
			gc.style.width      = null;
		}
	}
}