/*global QUnit*/

sap.ui.define([
	"registration/controller/registration.controller"
], function (Controller) {
	"use strict";

	QUnit.module("registration Controller");

	QUnit.test("I should test the registration controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
