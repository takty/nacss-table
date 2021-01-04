/**
 *
 * Table Style (JS)
 *
 * @author Takuto Yanagida
 * @version 2021-01-04
 *
 */


window.NACSS = window['NACSS'] || {};


(function (NS) {

	(function () {
		//=include _neat-width.js
		NS.tableNeatWidth = initialize;
	})();

	(function () {
		//=include _fixed-header.js
		NS.tableFixedHeader = initialize;
	})();

})(window.NACSS);
