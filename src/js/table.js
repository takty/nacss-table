/**
 * Table
 *
 * @author Takuto Yanagida
 * @version 2022-01-06
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
	// @include __scroll-padding-top.js

})(window['NACSS']['table']);
