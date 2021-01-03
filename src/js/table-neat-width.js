/**
 *
 * Table Style - Neat Wrap (JS)
 *
 * @author Takuto Yanagida
 * @version 2021-01-04
 *
 */


window.NACSS = window['NACSS'] || {};


(function (NS) {

	NS.tableNeatWidth = function (tabs, opts = {}) {
		if (tabs.length === 0) return;
		const lt = tabs[tabs.length - 1];
		const cm = Object.assign(opts, getCommonMetrics(lt), {
			nnwMinWidthRate : 0.1,
			minCharSize     : 8,
			cellMinWidth    : 100,
			cellMinAspect   : 2 / 3,  // width / height
			maxRowSize      : 200,
			maxBorderWidth  : 2,
		});
		cm.padH += cm.maxBorderWidth * 2;
		cm.padV += cm.maxBorderWidth * 2;
		cm.dcTd = makeDummyCell(lt, 'td');
		cm.dcTh = makeDummyCell(lt, 'th');
		for (const t of tabs) {
			if (!apply(t, cm) && cm.nnwMinWidthRate) {
				const pw = t.parentElement.clientWidth;
				const w  = t.clientWidth;
				if (pw - w < w * cm.nnwMinWidthRate) t.style.width = '100%';
			}
		}
		lt.removeChild(cm.dcTd);
		lt.removeChild(cm.dcTh);
	}

	function makeDummyCell(t, tagName) {
		const d = document.createElement(tagName);
		d.style.display    = 'inline-block';
		d.style.position   = 'fixed';
		d.style.visibility = 'hidden';
		d.style.whiteSpace = 'nowrap';
		return t.appendChild(d);
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
		const temp = document.createElement(elm.nodeName);
		temp.setAttribute('style', `position:fixed;margin:0;padding:0;font-family:${elm.style.fontFamily || 'inherit'};font-size:${elm.style.fontSize || 'inherit'};`);
		temp.innerHTML = '\u3000';  // Full width space
		elm.parentNode.appendChild(temp);
		const w = temp.clientWidth;
		const h = temp.clientHeight;
		temp.parentNode.removeChild(temp);
		return [w, h];
	}

	function apply(tab, cMet) {
		if (tab.rows.length === 0) return false;
		if (cMet.maxRowSize < tab.rows.length) return false;
		if (!isResizeNeeded(tab, cMet)) return false;

		if (tab.hasAttribute('width')) tab.removeAttribute('width');
		tab.style.width    = '';
		tab.style.maxWidth = '';

		const grid  = makeCellGrid(tab);
		const met   = Object.assign(getMetrics(tab, grid), cMet);
		const newWs = calcNewWidths(grid, met);
		setCellWidth(grid, newWs);
		return true;
	}

	function isResizeNeeded(tab, cMet) {
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
		const newWs = new Array(gw).fill(false);
		const wrapped = new Array(gw).fill(false);

		for (let y = 0; y < grid.length; y += 1) {
			const gridRow = grid[y];

			for (let x = 0; x < gw; x += 1) {
				const td = gridRow[x];
				if (td === undefined || td === null || typeof td === 'number') continue;
				if (x < gw - 1 && typeof gridRow[x + 1] === 'number') continue;
				if (1 < parseInt(td.getAttribute('colSpan'), 10)) continue;
				if (1 < parseInt(td.getAttribute('rowSpan'), 10)) continue;

				const [minW, wp] = calcMinWidth(td, met);
				if (minW) newWs[x] = Math.max(newWs[x], minW);
				if (wp) wrapped[x] = wp;
			}
		}
		widenTabWidth(newWs, wrapped, met);
		return newWs;
	}

	function calcMinWidth(td, met) {
		const { padH, padV, charW, lineH, cellMinWidth, dcTd, dcTh, cellMinAspect, minCharSize } = met;
		if (calcMaxLineLength(td) < minCharSize) return [0, false];

		td.innerHTML = td.innerHTML.trim();
		const dc = td.tagName === 'TD' ? dcTd : dcTh;
		dc.innerHTML = td.innerHTML;
		const aw = dc.clientWidth - padH;
		const ls = Math.round((dc.clientHeight - padV) / lineH);
		let minW = 0, wrapped = false;
		for (let i = 1; ; i += 1) {
			const tempW = 0 | (aw / i + charW * i + padH);
			const tempH = ls * (i * lineH) + padV;
			if (tempW < cellMinWidth || tempW / tempH < cellMinAspect || (minW && minW < tempW)) break;
			if (1 < i) wrapped = true;
			minW = tempW;
		}
		return [minW, wrapped];
	}

	function calcMaxLineLength(td) {
		const ih = td.innerHTML.trim();
		let ls = ih.split(/<\s*br\s*\/?>/ui);
		if (ls.length === 0) ls = [ih];
		const ts = ls.map(e => e.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '').length);
		return Math.max(...ts);
	}

	function widenTabWidth(newWs, wrapped, met) {
		const { origTabW, origCellWs } = met;
		let wNew = 0, wFix = 0;
		for (let i = 0; i < newWs.length; i += 1) {
			if (wrapped[i]) {
				wNew += newWs[i];
			} else if (newWs[i]) {
				wFix += newWs[i];
			} else {
				wFix += origCellWs[i];
			}
		}
		if (origTabW < wNew + wFix) return;
		let rem = origTabW - wFix;
		for (let i = 0; i < newWs.length; i += 1) {
			if (!wrapped[i]) continue;
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
				if (w === false || !(gc instanceof HTMLTableCellElement)) continue;
				gc.style.whiteSpace = null;
				gc.style.minWidth   = w + 'px';
				gc.style.width      = null;
			}
		}
	}

})(window.NACSS);
