/**
 *
 * Table Style (JS)
 *
 * @author Takuto Yanagida
 * @version 2021-01-25
 *
 */


window.NACSS = window['NACSS'] || {};


(function (NS) {

	(function () {
		//=include _neat-width.js
		NS.tableNeatWidth = initialize;
	})();

	(function () {
		//=include _usable-view.js
		NS.tableUsableView = initialize;
	})();

	//=include _utilities.js

})(window.NACSS);
