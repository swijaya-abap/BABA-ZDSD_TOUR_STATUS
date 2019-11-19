sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, Utilities, History, JSONModel) {
	"use strict";

	return BaseController.extend("com.baba.ZDSD_TOUR_STATUS.controller.Page1", {
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			this.globalVar = {};
			this.globalVar.oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_TOUR_STATUS_SRV/", true);

			var jsonModel = new JSONModel();
			this.byId("MultiBranch").setModel(new JSONModel());
			this.byId("MultiVisitPlan").setModel(new JSONModel());
			this.byId("MultiUser").setModel(new JSONModel());

			this.selectedBranch = [];
			this.selectedVisitPlan = [];
			this.selectedUser = [];

			var oBusy = new sap.m.BusyDialog();
			this._onBusyS(oBusy);

			this.globalVar.oDataModel.read("/SELECTIONSet", {
				success: function (oData, oResponse) {
					var res = oData.results;
					this.globalVar.fullSet = res; // Save result into global variable for later use

					this.globalVar.branch = []; // Set mutlicombobox for branch

					// Append only unique branches
					for (var i = 0; i < res.length; i++) {
						var isFound = false;
						for (var j = 0; j < this.globalVar.branch.length; j++) {
							if (this.globalVar.branch[j].Branch === res[i].Branch) {
								isFound = true;
								break;
							}
						}
						if (!isFound) {
							this.globalVar.branch.push({
								Branch: res[i].Branch,
								BranchName: res[i].BranchName
							});
						}
					}
					// End append only unique branches

					this._setViewModel("MultiBranch", this.globalVar.branch); // Set model to view

					this._onBusyE(oBusy);
				}.bind(this),
				error: function (oResponse) {
					this._onBusyE(oBusy);
					var oMsg = JSON.parse(oResponse.responseText);
					MessageBox.error(oMsg.error.message.value);
				}.bind(this)
			});

			// this.oRouter.getTarget("Page1").attachDisplay(jQuery.proxy(this._handleRouteMatched, this));
		},

		onButtonPress: function () {
			var jsonModel = new JSONModel();
			this.getView().setModel(jsonModel, "modelData");
			if (this.selectedUser.length > 0) {

				var firstTable = [];
				var secondTable = [];
				var thirdTable = [];

				var oBusy = new sap.m.BusyDialog();
				this._onBusyS(oBusy);

				var PLFilters = [];

				for (var i = 0; i < this.selectedUser.length; i++) {
					PLFilters.push(new sap.ui.model.Filter({
						path: "Route",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: this.selectedUser[i].key
					}));
				}

				this.globalVar.oDataModel.read("/TOURSet", {
					filters: PLFilters,
					success: function (oData, oResponse) {
						var res = oData.results;

						for (i = 0; i < res.length; i++) {
							if (res[i].Category === "1") {
								firstTable.push(res[i]);
							} else if (res[i].Category === "2") {
								secondTable.push(res[i]);
							} else {
								thirdTable.push(res[i]);
							}
						}

						jsonModel.setData({
							countFirst: firstTable.length,
							countSecond: secondTable.length,
							countThird: thirdTable.length,
							FirstTable: firstTable,
							SecondTable: secondTable,
							ThirdTable: thirdTable
						});
						this.getView().setModel(jsonModel, "modelData");

						this._onBusyE(oBusy);
					}.bind(this),
					error: function (oResponse) {
						this._onBusyE(oBusy);
						var oMsg = JSON.parse(oResponse.responseText);
						MessageBox.error(oMsg.error.message.value);
					}.bind(this)
				});
			} else {
				MessageBox.error("Please select user before retrieving data.");
			}
		},

		onMultiBranchChange: function (oEvent) {
			this.multiBranchChanged = true;
		},

		onMultiVisitPlanChange: function (oEvent) {
			this.multiVisitPlanChanged = true;
		},

		onMultiUserChange: function (oEvent) {
			this.multiUserChanged = true;
		},

		onMultiBranchFinish: function (oEvent) {
			if (this.multiBranchChanged) {
				this.multiBranchChanged = false;
				var selectedItems = oEvent.getParameter("selectedItems");
				this.selectedBranch = this._getMultiBoxKey(selectedItems); //Get selected branches

				this._clearViewModel("MultiVisitPlan"); //Clear Multi Combo Box of Visit Plan
				this._clearViewModel("MultiUser"); //Clear Multi Combo Box of User

				//Append data for Visit Plan
				this.globalVar.visitPlan = [];
				for (var i = 0; i < this.globalVar.fullSet.length; i++) {
					var isFound = false;

					//Check if this branch is selected
					for (var j = 0; j < this.selectedBranch.length; j++) {
						if (this.globalVar.fullSet[i].Branch === this.selectedBranch[j].key) {
							isFound = true;
							break;
						}
					}
					//End check if this branch is selected

					if (isFound) {
						//Append only unique visit plan
						isFound = false;
						for (j = 0; j < this.globalVar.visitPlan.length; j++) {
							if (this.globalVar.visitPlan[j].VisitPlan === this.globalVar.fullSet[i].VisitPlan) {
								isFound = true;
								break;
							}
						}
						if (!isFound) {
							this.globalVar.visitPlan.push({
								VisitPlan: this.globalVar.fullSet[i].VisitPlan,
								VisitPlanName: this.globalVar.fullSet[i].VisitPlanName
							});
						}
						// ENd append only unique visit plan
					}
				}
				//End append data for Visit Plan

				if (this.globalVar.visitPlan.length > 0) {
					this._setViewModel("MultiVisitPlan", this.globalVar.visitPlan); //Populate data to view model
				}
			}
		},

		onMultiVisitFinish: function (oEvent) {
			if (this.multiVisitPlanChanged) {
				this.multiVisitPlanChanged = false;
				var selectedItems = oEvent.getParameter("selectedItems");
				this.selectedVisitPlan = this._getMultiBoxKey(selectedItems); //Get selected visit plan

				this._clearViewModel("MultiUser"); //Clear Multi Combo Box of User

				//Append data for Visit Plan
				this.globalVar.user = [];
				for (var i = 0; i < this.globalVar.fullSet.length; i++) {
					var isFound = false;

					//Check if this branch is selected
					for (var j = 0; j < this.selectedBranch.length; j++) {
						if (this.globalVar.fullSet[i].Branch === this.selectedBranch[j].key) {
							isFound = true;
							break;
						}
					}
					//End check if this branch is selected

					//Check if this visit plan is selected
					if (isFound) {
						isFound = false;
						for (j = 0; j < this.selectedVisitPlan.length; j++) {
							if (this.globalVar.fullSet[i].VisitPlan === this.selectedVisitPlan[j].key) {
								isFound = true;
								break;
							}
						}
					}
					//End check if this visit plan is selected

					if (isFound) {
						//Append only unique user
						isFound = false;
						for (j = 0; j < this.globalVar.user.length; j++) {
							if (this.globalVar.user[j].User === this.globalVar.fullSet[i].User) {
								isFound = true;
								break;
							}
						}
						if (!isFound) {
							this.globalVar.user.push({
								User: this.globalVar.fullSet[i].User,
								UserName: this.globalVar.fullSet[i].UserName
							});
						}
						// ENd append only unique user
					}
				}
				//End append data for Visit Plan

				if (this.globalVar.user.length > 0) {
					this._setViewModel("MultiUser", this.globalVar.user); //Populate data to view model
				}
			}
		},

		onMultiUserFinish: function (oEvent) {
			if (this.multiUserChanged) {
				this.multiUserChanged = false;
				var selectedItems = oEvent.getParameter("selectedItems");
				this.selectedUser = this._getMultiBoxKey(selectedItems); //Get selected visit plan
			}
		},

		_setViewModel: function (modelName, data) {
			var oModel = this.byId(modelName).getModel();
			oModel.setData({
				Data: data
			});
			this.byId(modelName).setModel(oModel);
			this.byId(modelName).getModel().refresh(true);
		},

		_clearViewModel: function (modelName) {
			var oModel = this.byId(modelName).getModel();
			oModel.setData({
				Data: {}
			});
			this.byId(modelName).setModel(oModel);
		},

		_getMultiBoxKey: function (selectedItems) {
			var ret = [];
			for (var i = 0; i < selectedItems.length; i++) {
				var data = {
					key: selectedItems[i].getKey()
				};
				ret.push(data);
			}
			return ret;
		},

		_onBusyS: function (oBusy) {
			oBusy.open();
			oBusy.setBusyIndicatorDelay(40000);
		},

		_onBusyE: function (oBusy) {
			oBusy.close();
		},

		_handleRouteMatched: function (oEvent) {
			var sAppId = "App5d984d7b2bcf106eb6fa867f";

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function (oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype" && prop.includes("Set")) {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

		}
	});
}, /* bExport= */ true);