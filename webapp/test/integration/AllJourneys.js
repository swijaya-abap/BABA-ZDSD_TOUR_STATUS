/* global QUnit*/

sap.ui.define([
	"sap/ui/test/Opa5",
	"com/baba/ZDSD_TOUR_STATUS/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/baba/ZDSD_TOUR_STATUS/test/integration/pages/Page1",
	"com/baba/ZDSD_TOUR_STATUS/test/integration/navigationJourney"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.baba.ZDSD_TOUR_STATUS.view.",
		autoWait: true
	});
});