/**
 *
 * Table
 *
 * @author Takuto Yanagida
 * @version 2021-12-26
 *
 */


'use strict';

window['NACSS']          = window['NACSS']          || {};
window['NACSS']['table'] = window['NACSS']['table'] || {};


((NS) => {

	// @include __style-class.js
	// @include __utility.js
	{
		// @include _neat-width.js
		NS.applyNeatWidth = apply;
	}
	{
		// @include _usable-view.js
		NS.applyUsableView = apply;
	}

})(window['NACSS']['table']);
