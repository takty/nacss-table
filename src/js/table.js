/**
 *
 * Table
 *
 * @author Takuto Yanagida
 * @version 2021-12-06
 *
 */


'use strict';

window['NACSS'] = window['NACSS'] || {};


(function (NS) {

	{
		// @include _neat-width.js
		NS.tableNeatWidth = initialize;
	}

	{
		// @include _usable-view.js
		NS.tableUsableView = initialize;
	}

	// @include _style-class.js
	// @include _utility.js

})(window['NACSS']);
