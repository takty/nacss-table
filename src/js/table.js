/**
 *
 * Table Style (JS)
 *
 * @author Takuto Yanagida
 * @version 2021-11-11
 *
 */


window['NACSS'] = window['NACSS'] || {};


(function (NS) {

	(function () {
		// @include _neat-width.js
		NS.tableNeatWidth = initialize;
	})();

	(function () {
		// @include _usable-view.js
		NS.tableUsableView = initialize;
	})();

	// @include _style-class.js
	// @include _utilities.js

})(window['NACSS']);
