sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, Utilities, History, JSONModel) {
	"use strict";

	return BaseController.extend("com.baba.ZDSD_TOUR_STS.controller.Page1", {
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			this.globalVar = {};
			this.globalVar.oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_TOUR_STATUS_SRV/", true);

			this.byId("MultiBranch").setModel(new JSONModel());
			this.byId("MultiVisitPlan").setModel(new JSONModel());
			this.byId("MultiUser").setModel(new JSONModel());

			this.byId("MultiBranch").getModel().setSizeLimit("500");
			this.byId("MultiVisitPlan").getModel().setSizeLimit("500");
			this.byId("MultiUser").getModel().setSizeLimit("500");

			this.selectedBranch = [];
			this.selectedVisitPlan = [];
			this.selectedUser = [];

			var oBusy = new sap.m.BusyDialog();
			this._onBusyS(oBusy);

			this.globalVar.oDataModel.read("/SELECTIONSet", {
				success: function (oData, oResponse) {
					var res = oData.results;

					if (res[0].Message !== "") { //Check error from backend
						MessageBox.error(res[0].Message);
					} else {
						this.globalVar.fullSet = res; // Save result into global variable for later use

						this.globalVar.poweruserEnabled = res[0].PoweruserEnabled;
						if (this.globalVar.poweruserEnabled) {
							var jsonModel = new JSONModel();

							jsonModel.setData({
								resendVisible: false,
								removeVisible: false,
								uploadVisible: false
							});
							this.getView().setModel(jsonModel, "modelView");
						}

						this._setBranchComboBox(true);

						this._setVisitPlanComboBox(true); //Set visit plan combo box and default everything to be selected

						this._setUserComboBox(true); //Set User plan combo box and default everything to be selected
					}

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
						value1: this.selectedUser[i]
					}));
				}

				this.globalVar.oDataModel.read("/TOURSet", {
					filters: PLFilters,
					success: function (oData, oResponse) {
						var res = oData.results;

						if (res[0].Message !== "") { //Check error from backend
							MessageBox.error(res[0].Message);
						} else {
							
							this.globalVar.selectedTour = "";

							for (i = 0; i < res.length; i++) {
								res[i].TourDate = this._convertDate(res[i].TourDate, "dd.MM.yyyy");
								if (res[i].Category === "S" || res[i].Category === "W") {
									firstTable.push(res[i]);
								} else if (res[i].Category === "E") {
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
						}

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

		onResendPress: function (oEvent) {
			if (!this._isTourSelected()) {
				MessageBox.error("Please select tour");
			} else {
				this.globalVar.entitySet = "/RESENDSet";
				this._openDialog("SecureDialog", "Resend Tour");
			}
		},

		onRemovePress: function (oEvent) {
			if (!this._isTourSelected()) {
				MessageBox.error("Please select tour");
			} else {
				this.globalVar.entitySet = "/REMOVESet";
				this._openDialog("SecureDialog", "Remove Tour");
			}
		},

		onUploadPress: function (oEvent) {
			if (!this._isTourSelected()) {
				MessageBox.error("Please select tour");
			} else {
				this.globalVar.entitySet = "/UPLOADSet";
				this._openDialog("SecureDialog", "Upload Tour Manually");
			}
		},

		onSelChangeFirst: function (oEvent) {
			this._removeAllSelectionExcept("firstTable");
			this._setSelectedTour("firstTable");
		},

		onSelChangeSecond: function (oEvent) {
			this._removeAllSelectionExcept("secondTable");
			this._setSelectedTour("secondTable");
		},

		onSelChangeThird: function (oEvent) {
			this._removeAllSelectionExcept("thirdTable");
			this._setSelectedTour("thirdTable");
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

				this._setVisitPlanComboBox(false); //Set Visit Plan Combo Box data based on selected branch
			}
		},

		onMultiVisitFinish: function (oEvent) {
			if (this.multiVisitPlanChanged) {
				this.multiVisitPlanChanged = false;
				var selectedItems = oEvent.getParameter("selectedItems");
				this.selectedVisitPlan = this._getMultiBoxKey(selectedItems); //Get selected visit plan

				this._clearViewModel("MultiUser"); //Clear Multi Combo Box of User

				this._setUserComboBox(true);
			}
		},

		onMultiUserFinish: function (oEvent) {
			if (this.multiUserChanged) {
				this.multiUserChanged = false;
				var selectedItems = oEvent.getParameter("selectedItems");
				this.selectedUser = this._getMultiBoxKey(selectedItems); //Get selected visit plan
			}
		},

		onSecureOk: function (oEvent) {
			var secureKey = this.byId("InSecKey").getValue();

			if (secureKey === undefined || secureKey === "") {
				MessageBox.error("Please enter secure key");
			} else {

				// Set busy indicator
				var oBusy = new sap.m.BusyDialog();
				this._onBusyS(oBusy);

				// Set entity set path
				var path = this.globalVar.entitySet + "(TourId='" + this.globalVar.selectedTour + "',SecureKey='" + secureKey + "')";

				// Call entity set
				this.globalVar.oDataModel.read(path, {
					success: function (oData, oResponse) {
						var res = oData;

						if (res.Message !== "") { //Check error from backend
							MessageBox.error(res.Message);
						} else {
							sap.m.MessageToast.show("Success");
							this.byId("SecureDialog").close();
						}
						this._onBusyE(oBusy);
					}.bind(this),
					error: function (oResponse) {
						this._onBusyE(oBusy);
						var oMsg = JSON.parse(oResponse.responseText);
						MessageBox.error(oMsg.error.message.value);
					}.bind(this)
				});
			}
		},

		onSecureClose: function (oEvent) {
			this.byId("SecureDialog").close();
		},

		_isTourSelected: function () {
			if (this.globalVar.selectedTour === "" || this.globalVar.selectedTour === undefined) {
				return false;
			} else {
				return true;
			}
		},

		_setSelectedTour: function (id) {
			var selectedContext = this.byId(id).getSelectedContexts();
			var selectedObject = selectedContext[0].getObject();
			this.globalVar.selectedTour = selectedObject.TourId;
		},

		_openDialog: function (iDialogName, iTitle) {
			var oView = this.getView();
			var oDialog = this.byId(iDialogName);
			// create dialog lazily
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_TOUR_STS.view." + iDialogName, this);
				oView.addDependent(oDialog);
			}
			oDialog.setTitle(iTitle);
			oDialog.open();
		},

		_removeAllSelectionExcept: function (id) {
			if (id !== "firstTable") this.byId("firstTable").removeSelections();
			if (id !== "secondTable") this.byId("secondTable").removeSelections();
			if (id !== "thirdTable") this.byId("thirdTable").removeSelections();
		},

		_convertDate: function (date, format) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: format
			});
			var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
			return dateFormat.format(new Date(date.getTime() + TZOffsetMs));
		},

		_setBranchComboBox: function (setSelected) {
			this.globalVar.branch = []; // Set mutli combo box for branch
			// Append only unique branches
			for (var i = 0; i < this.globalVar.fullSet.length; i++) {
				var isFound = false;
				for (var j = 0; j < this.globalVar.branch.length; j++) {
					if (this.globalVar.branch[j].Branch === this.globalVar.fullSet[i].Branch) {
						isFound = true;
						break;
					}
				}
				if (!isFound) {
					this.globalVar.branch.push({
						Branch: this.globalVar.fullSet[i].Branch,
						BranchName: this.globalVar.fullSet[i].BranchName
					});
					if (setSelected) this.selectedBranch.push(this.globalVar.fullSet[i].Branch); //Set as selected branch
				}
			}
			// End append only unique branches

			this._setViewModel("MultiBranch", this.globalVar.branch, this.selectedBranch); // Set model to view
		},

		_setUserComboBox: function (setSelected) {
			//Append data for Visit Plan
			this.globalVar.user = [];
			this.selectedUser = [];
			for (var i = 0; i < this.globalVar.fullSet.length; i++) {
				var isFound = false;

				//Check if this branch is selected
				for (var j = 0; j < this.selectedBranch.length; j++) {
					if (this.globalVar.fullSet[i].Branch === this.selectedBranch[j]) {
						isFound = true;
						break;
					}
				}
				//End check if this branch is selected

				//Check if this visit plan is selected
				if (isFound) {
					isFound = false;
					for (j = 0; j < this.selectedVisitPlan.length; j++) {
						if (this.globalVar.fullSet[i].VisitPlan === this.selectedVisitPlan[j]) {
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
						if (setSelected) this.selectedUser.push(this.globalVar.fullSet[i].User);
					}
					// ENd append only unique user
				}
			}
			//End append data for Visit Plan

			if (this.globalVar.user.length > 0) {
				this._setViewModel("MultiUser", this.globalVar.user, this.selectedUser); //Populate data to view model
			}
		},

		_setVisitPlanComboBox: function (setSelected) {
			//Append data for Visit Plan
			this.globalVar.visitPlan = [];
			for (var i = 0; i < this.globalVar.fullSet.length; i++) {
				var isFound = false;

				//Check if this branch is selected
				for (var j = 0; j < this.selectedBranch.length; j++) {
					if (this.globalVar.fullSet[i].Branch === this.selectedBranch[j]) {
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
						if (setSelected) this.selectedVisitPlan.push(this.globalVar.fullSet[i].VisitPlan);
					}
					// ENd append only unique visit plan
				}
			}
			//End append data for Visit Plan

			if (this.globalVar.visitPlan.length > 0) {
				this._setViewModel("MultiVisitPlan", this.globalVar.visitPlan, this.selectedVisitPlan); //Populate data to view model
			}
		},

		_setViewModel: function (modelName, data, selected) {
			var oModel = this.byId(modelName).getModel();
			oModel.setData({
				Data: data,
				Selected: selected
			});
			if (selected.length > 0) {
				var lSelected = oModel.getProperty("/Selected");
				if (lSelected.length === 0) oModel.setProperty("/Selected", selected);
				this.byId(modelName).bindProperty("selectedKeys", "/Selected");
			}
			this.byId(modelName).setModel(oModel);
			this.byId(modelName).getModel().refresh(true);
		},

		_clearViewModel: function (modelName) {
			var oModel = this.byId(modelName).getModel();
			oModel.setData({
				Data: {}
			});
			this.byId(modelName).setModel(oModel);
			this.byId(modelName).getModel().refresh(true);
		},

		_getMultiBoxKey: function (selectedItems) {
			var ret = [];
			for (var i = 0; i < selectedItems.length; i++) {
				// var data = {
				// 	key: selectedItems[i].getKey()
				// };
				ret.push(selectedItems[i].getKey());
			}
			return ret;
		},

		_onBusyS: function (oBusy) {
			oBusy.open();
			oBusy.setBusyIndicatorDelay(40000);
		},

		_onBusyE: function (oBusy) {
			oBusy.close();
		}

		// _handleRouteMatched: function (oEvent) {
		// 	// var sAppId = "App5d984d7b2bcf106eb6fa867f";

		// 	var oParams = {};

		// 	// if (oEvent.mParameters.data.context) {
		// 	// 	this.sContext = oEvent.mParameters.data.context;

		// 	// } else {
		// 	if (this.getOwnerComponent().getComponentData()) {
		// 		var patternConvert = function (oParam) {
		// 			if (Object.keys(oParam).length !== 0) {
		// 				for (var prop in oParam) {
		// 					if (prop !== "sourcePrototype" && prop.includes("Set")) {
		// 						return prop + "(" + oParam[prop][0] + ")";
		// 					}
		// 				}
		// 			}
		// 		};

		// 		this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

		// 	}
		// 	// }

		// 	var oPath;

		// 	if (this.sContext) {
		// 		oPath = {
		// 			path: "/" + this.sContext,
		// 			parameters: oParams
		// 		};
		// 		this.getView().bindObject(oPath);
		// 	}

		// }
	});
}, /* bExport= */ true);