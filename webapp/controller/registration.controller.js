sap.ui.define([

    "./BaseController",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Core",


],
    function (BaseController,
        Fragment,
        MessageBox,
        MessageToast,
        Core,


    ) {
        "use strict";

        return BaseController.extend("registration.controller.registration", {
            onInit: function () {
                this.fmodel = this.getOwnerComponent().getModel()
                this._MessageManager = Core.getMessageManager();
                // Clear the old messages
                this._MessageManager.removeAllMessages();
                this._MessageManager.registerObject(this.getView(), true);
                this._aRandomizationDeletePaths = [];
                this.getView().setModel(this._MessageManager.getMessageModel(), "message");
            },
            subReg(evn) {

                this.getOwnerComponent().getRouter().navTo("RoutersubjectReg", {



                    path: window.encodeURIComponent(evn.getSource().getBindingContext().getPath())

                })
                sap.ui.core.BusyIndicator.show(0)
            },
            addForm() {

                Fragment.load({
                    name: "registration.fragments.addRegDetails",
                    controller: this
                }).then((f) => {
                    this.getView().addDependent(f)
                    var oContext = this.getOwnerComponent().getModel().createEntry("/SubRegHeaderSet")
                    f.setBindingContext(oContext)
                    f.open()
                })
            },
            addRegistrationDetails(oEvent) {



                var aPromises = [];
                var oView = this.getView();
                var object = oEvent.getSource().getBindingContext().getObject();

                oEvent.getSource().getParent().getContent()[0].getGroups().forEach(oGroup => {
                    oGroup.getGroupElements().forEach(oElement => {
                        // aPromises.push(oElement.getElements()[0].checkValuesValidity());
                        aPromises.push(new Promise(function (resolve, reject) {
                            var oControl = oElement.getElements()[0];
                            if (oControl.getMandatory() && !oControl.getValue()) {
                                this._addErrorMessages(`This is a required field`, `${oControl.getBindingContext().getPath()}/${oControl.getBinding("value").getPath()}`);
                                reject();
                            } else {

                                resolve()

                            }
                        }.bind(this)));
                    });

                });
                Promise.all(aPromises).then(aResults => {
                    this.fmodel.submitChanges({
                        success: function (oData) {
                            var oResponse = oData.__batchResponses && oData.__batchResponses.length && (oData.__batchResponses[0].response || oData.__batchResponses[0].__changeResponses && oData.__batchResponses[0].__changeResponses[0]);
                            if (oResponse && oResponse.statusCode < "300") {
                                var sMessage = oResponse.statusText === "Created" ? "Entry created successfully" : "Entry is updated successfully";
                                MessageToast.show(sMessage);
                                oEvent.getSource().getParent().close()

                                this.byId("addDialog").getEndButton().firePress();
                            } else if (oResponse.length === 0) {
                                MessageToast.show("No Changes Done");
                            } else {
                                MessageBox.error(JSON.parse(oResponse.body).error.message.value);
                            }

                            oView.setBusy(false);
                        }.bind(this),
                        error: function (oError) {
                            oView.setBusy(false);
                            MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        }
                    });
                });



            },
            delete(evn) {
                var indices = evn.getSource().getParent().getParent().getTable().getSelectedItems()
                indices.forEach(index => {
                    var spath = index.getBindingContextPath()
                    this.getOwnerComponent().getModel().remove(spath)
                    evn.getSource().setEnabled(false)
                });
            },

            cancel(evn) {
                evn.getSource().getParent().close()
                this.fmodel.resetChanges()
            },

            change(evn) {
                evn.getSource().getParent().getToolbar().getContent()[3].setEnabled(evn.getSource().getSelectedItems().length > 0)
            },
            autoInitl(oEvent) {
                this.capitalizeFirstLetter(oEvent)

                var obj = oEvent.getSource().getBindingContext().getObject()

                var motsurname = obj.MotSurname
                var fothersurname = obj.FatSurname
                var SubjectName = obj.SubjectName
                if (motsurname && fothersurname && SubjectName) {
                    this.fmodel.setProperty(`${oEvent.getSource().getBindingContext().getPath()}/SubjectInitials`, `${SubjectName[0]}-${fothersurname[0]}-${motsurname[0]}`)
                }
            },
            autoRegNO(oEvent) {
                this.capitalizeFirstLetter(oEvent)
                var obj = oEvent.getSource().getBindingContext().getObject()
                var subjectId = obj.SubjectId;
                var siteCode = obj.SiteCode
                if (subjectId && siteCode) {
                    this.fmodel.setProperty(`${oEvent.getSource().getBindingContext().getPath()}/RegNo`, `${siteCode}-${subjectId}`)
                }
            },
            Calculatedob(oEvent) {

                var dob = oEvent.getSource().getValue();
                const birthDate = new Date(dob);
                const today = new Date();

                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDifference = today.getMonth() - birthDate.getMonth();

                if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                // Ensure Age is an integer (remove any decimals)
                var formattedAge = Number(age); // Round to the nearest integer

                // Set the age in the model

                this.fmodel.setProperty(`${oEvent.getSource().getBindingContext().getPath()}/Age`, String(formattedAge));

            },


            calculateBMI(oEvent) {
                // Convert height from cm to meters
                var obj = oEvent.getSource().getBindingContext().getObject()
                var height = obj.Height
                var weight = obj.Weight
                const
                    heightInMeters = height / 100;
                // Calculate BMI
                var bmi = weight / (heightInMeters * heightInMeters);
                bmi = bmi.toFixed(2)
                if (height && weight) {
                    this.fmodel.setProperty(`${oEvent.getSource().getBindingContext().getPath()}/Bmi`, bmi)
                }
            },

        });
    });
