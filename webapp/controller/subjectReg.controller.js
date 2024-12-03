sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/ui/core/Core",
	"sap/ui/model/Filter"

], function (
	BaseController,
	JSONModel,
	MessageToast,
	Fragment,
	MessageBox,
	Core,
	Filter


) {
	"use strict";
	return BaseController.extend("registration.controller.subjectReg", {
		/**
		 * @override
		 */
		onInit: function () {
			var oView = this.getView()
			this.fmodel = this.getOwnerComponent().getModel()
			this.fmodel.setDeferredGroups(this.fmodel.getDeferredGroups().concat(["create", "update"]))
			this._Route = this.getOwnerComponent().getRouter()
			this._Route.getRoute("RoutersubjectReg").attachPatternMatched(this.dataMatched, this)
			var oModel = new JSONModel({
				"edit": false
			})

			this.getView().setModel(oModel, "data")
			this._MessageManager = Core.getMessageManager();
			// Clear the old messages
			this._MessageManager.removeAllMessages();
			this._MessageManager.registerObject(oView, true);
			this._aRandomizationDeletePaths = [];
			oView.setModel(this._MessageManager.getMessageModel(), "message");

		},
		dataMatched(oEvent) {
			sap.ui.core.BusyIndicator.hide();
			this.getView().getModel("data").setProperty("/edit", false)
			this.path = window.decodeURIComponent(oEvent.getParameter("arguments").path)
			this.getView().bindElement({
				path: this.path,
				parameters: {
					expand: "SubRegStudyPHNav"
				},
				events: {
					dataRequested: function (oEvent) {

					},
					dataReceived: function (oEvent) {

						this.data = oEvent.getParameter("data")
						JsBarcode(".barcode", this.data.RegNo, {

							width: 1,
							height: 50,
							fontSize: 12

						});

					}
				}



			})


		},
		onEdit() {
			this._MessageManager.removeAllMessages()
			this.getView().getModel("data").setProperty("/edit", true)

		},
		onCancelEdit() {
			this.fmodel.resetChanges()
			this.getView().getModel("data").setProperty("/edit", false)
		},
		onSave(oEvent) {


			this._MessageManager.removeAllMessages()
			var aPromises = [];
			var oView = this.getView();
			var object = oEvent.getSource().getBindingContext().getObject();
			var arr = ["addSForm", "emgFormId", "communicationId", "remarksId", "addressId", "screeningID"]
			arr.forEach(id => {
				this.byId(id).getGroups().forEach(oGroup => {
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
			});
			Promise.all(aPromises).then(aResults => {
				this.fmodel.submitChanges({
					success: function (oData) {
						var oResponse = oData.__batchResponses && oData.__batchResponses.length && (oData.__batchResponses[0].response || oData.__batchResponses[0].__changeResponses && oData.__batchResponses[0].__changeResponses[0]);
						if (oResponse && oResponse.statusCode < "300") {
							var sMessage = oResponse.statusText === "Created" ? "Entry created successfully" : "Entry is updated successfully";
							MessageToast.show(sMessage);
							this.getView().getModel("data").setProperty("/edit", false)
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


		onEscClose(oEvent) {
			if (this._videoStream) {
				this._videoStream.getTracks().forEach(function (track) {
					track.stop();

				});

			}
			oEvent.getSource().destroy()
		},
		async onOpenCamera() {
			this.oDialog = await this.loadFragment({
				name: "registration.fragments.cameraOpen"
			})
			this.oDialog.open()

			var oVideoContainer = this.byId("videoContainer");
			var oCaptureButton = this.byId("captureButton");
			// Assuming you give an ID to the Open Camera button
			var oVideo = document.createElement("video");


			oVideo.setAttribute("autoplay", "true");
			oVideo.style.display = "block";

			// Append video element to the VBox
			oVideoContainer.getDomRef().appendChild(oVideo);

			// Access the user's camera
			navigator.mediaDevices.getUserMedia({ video: true })
				.then(function (stream) {
					oVideo.srcObject = stream;
					oCaptureButton.setVisible(true); // Show capture button
					// Store the stream to stop it later
					this._videoStream = stream;
				}.bind(this))
				.catch(function (error) {
					console.error("Error accessing camera: ", error);
				});
		},
		cancelVideo(oEvent) {
			if (this._videoStream) {
				this._videoStream.getTracks().forEach(function (track) {
					track.stop();

				});

			}
			oEvent.getSource().getParent().destroy()
		},

		onCapturePhoto: function (oEvent) {
			var oVideo = document.querySelector("video");
			var canvas = document.createElement("canvas");
			var context = canvas.getContext("2d");

			if (!oVideo) {
				console.error("Video element not found");
				return;
			}
			// Set canvas dimensions to video dimensions
			canvas.width = oVideo.videoWidth;
			canvas.height = oVideo.videoHeight;

			// Draw the video frame to the canvas
			context.drawImage(oVideo, 0, 0, canvas.width, canvas.height);

			// Get the image data URL and update the model
			var dataURL = canvas.toDataURL("image/png");
			var obj = oEvent.getSource().getBindingContext().getObject();
			var oData = {
				SiteCode: obj.SiteCode,
				SubjectId: obj.SubjectId,
				AttachNo: '001',
				AttachName: 'Image',
				Data: dataURL
			}
			this.fmodel.update(`/DocAttachmentsSet(AttachNo='001',SiteCode='${obj.SiteCode}',SubjectId='${obj.SubjectId}`, oData, {
				success: (oData) => {
					debugger
				},
				error: oError => {


				}
			})
			this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/ImageUrl`, dataURL)
			this.fmodel.submitChanges({ success: ((data) => { console.log(data) }) })



			// Optionally, you can stop the stream if you're done taking pictures
			// Uncomment if you want to stop the camera after capturing one image

			if (this._videoStream) {
				this._videoStream.getTracks().forEach(function (track) {
					track.stop();

				});

			}
			oEvent.getSource().getParent().destroy()
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


		async onSign(oEvent) {
			this.oDialog1 = await this.loadFragment({
				name: "registration.fragments.sign"
			})
			this.oDialog1.open()
			var oContainer = this.getView().byId("html")
			var canvas = document.createElement("canvas");
			canvas.width = 800;  // Set the width you want
			canvas.height = 500;
			oContainer.getDomRef().appendChild(canvas);
			canvas.id = "signed"
			var context = canvas.getContext("2d");
			context.fillStyle = "#fff";
			context.strokeStyle = "#444";
			context.lineWidth = 3.5;
			context.lineCap = "round";
			context.fillRect(0, 0, canvas.width, canvas.height);
			var disableSave = true;
			var pixels = [];
			var cpixels = [];
			var xyLast = {};
			var xyAddLast = {};
			var calculate = false;
			var empty = true;
			function get_coords(e) {
				var x, y;
				if (e.changedTouches && e.changedTouches[0]) {
					var offsety = canvas.offsetTop || 0;
					var offsetx = canvas.offsetLeft || 0;
					x = e.changedTouches[0].pageX - offsetx;
					y = e.changedTouches[0].pageY - offsety;
				} else if (e.layerX || e.layerX === 0) {
					x = e.layerX;
					y = e.layerY;
				} else if (e.offsetX || e.offsetX === 0) {
					x = e.offsetX;
					y = e.offsetY;
				}
				return { x: x, y: y };
			}

			function on_mousedown(e) {
				e.preventDefault();
				e.stopPropagation();
				empty = false;
				var xy = get_coords(e);
				context.beginPath();
				pixels.push('moveStart');
				context.moveTo(xy.x, xy.y);
				pixels.push(xy.x, xy.y);
				xyLast = xy;
				canvas.addEventListener('mousemove', on_mousemove, false);
				canvas.addEventListener('touchmove', on_mousemove, false);
			}
			function on_mousemove(e) {
				e.preventDefault();
				e.stopPropagation();
				var xy = get_coords(e);
				var xyAdd = {
					x: (xyLast.x + xy.x) / 2,
					y: (xyLast.y + xy.y) / 2
				};
				if (calculate) {
					var xLast = (xyAddLast.x + xyLast.x + xyAdd.x) / 3;
					var yLast = (xyAddLast.y + xyLast.y + xyAdd.y) / 3;
					pixels.push(xLast, yLast);
				} else {
					calculate = true;
				}
				context.quadraticCurveTo(xyLast.x, xyLast.y, xyAdd.x, xyAdd.y);
				pixels.push(xyAdd.x, xyAdd.y);
				context.stroke();
				context.beginPath();
				context.moveTo(xyAdd.x, xyAdd.y);
				xyAddLast = xyAdd;
				xyLast = xy;
			}
			function on_mouseup() {
				canvas.removeEventListener('mousemove', on_mousemove, false);
				canvas.removeEventListener('touchmove', on_mousemove, false);
				disableSave = false;
				context.stroke();
				pixels.push('e');
				calculate = false;
			}
			canvas.addEventListener('mousedown', on_mousedown, false);
			canvas.addEventListener('touchstart', on_mousedown, false);
			document.body.addEventListener('mouseup', on_mouseup, false);
			document.body.addEventListener('touchend', on_mouseup, false);
		},
		saveButton: function (oEvent) {

			var canvas = document.getElementById("signed")
			var sLink = canvas.toDataURL('image/jpeg');
			var obj = oEvent.getSource().getBindingContext().getObject();
			var oData = {
				SiteCode: obj.SiteCode,
				SubjectId: obj.SubjectId,
				AttachNo: '002',
				AttachName: 'Signature',
				Data: sLink
			}
			this.fmodel.update(`/DocAttachmentsSet(AttachNo='002',SiteCode='${obj.SiteCode}',SubjectId='${obj.SubjectId}')`, oData, {
				success: (oData) => {
					debugger
				},
				error: oError => {


				}
			})
			this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/Signature`, sLink)
			this.fmodel.submitChanges({ success: ((data) => { console.log(data) }) })
			this.byId("sign").destroy()
		},

		clearButton: function (oEvent) {
			this.byId("sign").destroy()
		},
		dowloadBarcode() {
			var text = this.fmodel.getProperty(`${this.getView().getBindingContext().getPath()}/RegNo`)
			const canvas = document.createElement("canvas")
			JsBarcode(canvas, text, {

				width: 1,
				height: 50,
				fontSize: 12

			});
			// Create a link element to download the image
			const link = document.createElement('a');
			link.href = canvas.toDataURL('image/png'); // Convert canvas to data URL
			link.download = 'barcode.png'; // Set the name for the downloaded file

			link.click();
			this.byId("imgsrc").setSrc(link.href)

		},
		async onUpload(oEvent) {
			this.oDialog2 = await this.loadFragment({
				name: "registration.fragments.uploadfile",
				controller: this
			});
			this.attachName = oEvent.getSource().getTooltip()

			this.getView().addDependent(this.oDialog2);
			var oContext = this.getView().getBindingContext();
			this.oDialog2.setBindingContext(oContext);
			this.oDialog2.setTitle(`Attachment(${this.attachName})`)
			this.oDialog2.open()
		},
		onCancelAttach() {
			this.oDialog2.destroy()
		},
		addForm(oEvent) {
			var id = this.byId("studyPH")
			var sPath = oEvent.getSource().getBindingContext().getPath()
			var obj = oEvent.getSource().getBindingContext().getObject()
			var tableBind = id.getTableBindingPath()
			Fragment.load({
				name: "registration.fragments.addStudyParticipation",
				controller: this
			}).then((f) => {
				this.getView().addDependent(f)
				var oContext = this.getOwnerComponent().getModel().createEntry(`${sPath}/${tableBind}`, {
					groupId: "create",
					properties: {
						SiteCode: obj.SiteCode,
						SubjectId: obj.SubjectId
					}
				})
				f.setBindingContext(oContext)
				f.open()
			})
		},
		addStudyParticipationHistroy(oEvent) {

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
		onDeleteSubject(oEvent) {
			MessageBox.warning("Are you sure do you want to delete ?", {
				actions: ["delete", MessageBox.Action.CLOSE],
				emphasizedAction: "delete",
				onClose: ((action) => {
					if (action == "delete") {
						var sPath = this.getView().getBindingContext().getPath()
						this.getOwnerComponent().getModel().remove(sPath, {
							success: ((oEvent) => {
								this.getOwnerComponent().getRouter().navTo("Routeregistration")
							})
						})
					}
				})
			})

		},
		onSmartTableBeforeRebindTable: function (oEvent) {

			var aFilters = oEvent.getParameter("bindingParams").filters;
			aFilters.push(new sap.ui.model.Filter("AttachName", sap.ui.model.FilterOperator.EQ, this.attachName));




		},
		isCheck(oEvent) {
			var isTrue = oEvent.getSource().getValue()
			if (isTrue) {

				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgAdd1`, this.fmodel.getProperty(`${this.getView().getBindingContext().getPath()}/Address1`))
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgAdd2`, this.fmodel.getProperty(`${this.getView().getBindingContext().getPath()}/Address2`))
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgAdd3`, this.fmodel.getProperty(`${this.getView().getBindingContext().getPath()}/Address3`))
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgCity`, this.fmodel.getProperty(`${this.getView().getBindingContext().getPath()}/City`))

				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgDist`, this.fmodel.getProperty(`${this.getView().getBindingContext().getPath()}/District`))
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgState`, this.fmodel.getProperty(`${this.getView().getBindingContext().getPath()}/State`))
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgZip`, this.fmodel.getProperty(`${this.getView().getBindingContext().getPath()}/ZipCode`))
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgCountry`, this.fmodel.getProperty(`${this.getView().getBindingContext().getPath()}/Country`))


			} else {
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgAdd1`, "")
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgAdd2`, "")
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgAdd3`, "")
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgCity`, "")
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgDist`, "")
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgState`, "")
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgZip`, "")
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/EmgCountry`, "")
			}
		},




		onUploadComplete: function (oEvent) {

			this.getView().getModel().refresh(true)

			// var url = `${this.getOwnerComponent().getModel().sServiceUrl}${oEvent.getSource().getBindingContext().sPath}/$value`;
			if (this.ToolTip === "Image") {
				var obj = oEvent.getSource().getBindingContext().getObject()

				var url = `/sap/opu/odata/sap/ZGW_PPTSUBREG_SRV/DocAttachmentsSet(AttachNo='001',SiteCode='${obj.SiteCode}',SubjectId='${obj.SubjectId}')/$value?${Math.random(100)}`
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/ImageUrl`, url)
				this.byId("capturedImage").setSrc(url)
				// this.byId("capturedImage").fireLoad();
				this.fmodel.submitChanges({
					success: ((data) => {
						console.log(data)
						this.getView().getModel().refresh(true)


					})
				})

			}
			else if (this.ToolTip === "Signature") {
				var obj = oEvent.getSource().getBindingContext().getObject()
				var url = `/sap/opu/odata/sap/ZGW_PPTSUBREG_SRV/DocAttachmentsSet(AttachNo='002',SiteCode='${obj.SiteCode}',SubjectId='${obj.SubjectId}')/$value?${Math.random(100)}`
				this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/Signature`, url)
				this.byId("signature").setSrc(url)

				this.fmodel.submitChanges({
					success: ((data) => {
						console.log(data)
						this.getView().getModel().refresh(true)


					})
				})
			}
		},
		onSubmitAttachments: function (oEvent) {


			var siteCode = this.fmodel.getProperty(`${oEvent.getSource().getBindingContext().getPath()}/SiteCode`)
			var subjectId = this.fmodel.getProperty(`${oEvent.getSource().getBindingContext().getPath()}/SubjectId`)
			this.ToolTip = oEvent.getSource().getTooltip();
			var oFileUploader = oEvent.getSource();
			this.csrfToken = this.getView().getModel().getSecurityToken();
			oFileUploader.setSendXHR(true);
			var headerParma = new sap.ui.unified.FileUploaderParameter();
			headerParma.setName('x-csrf-token');
			headerParma.setValue(this.csrfToken);
			oFileUploader.addHeaderParameter(headerParma);
			var headerParma2 = new sap.ui.unified.FileUploaderParameter();
			headerParma2.setName('slug');
			if (this.ToolTip === 'Image' || this.ToolTip === 'Signature') {
				this.byId("capturedImage").setBusy(true)
				headerParma2.setValue(`${oFileUploader.getValue()},${siteCode},${subjectId},AttachNo,${this.ToolTip}`);
			} else {
				headerParma2.setValue(`${oFileUploader.getValue()},${siteCode},${subjectId},AttachNo,${this.attachName}`)
			}

			oFileUploader.addHeaderParameter(headerParma2);
			oFileUploader.checkFileReadable().then(function () {
				oFileUploader.upload();

				oFileUploader.destroyHeaderParameters();
			}, function (error) {
				sap.m.MessageToast.show("The file cannot be read. It may have changed.");
			}).then(function () {

				oFileUploader.clear();

			});


		},
		async onGenderInputValueHelp() {
			this.oDia = await this.loadFragment({ name: 'registration.fragments.f4valueGender' })
			this.oDia.open();
		},
		onColumnListItemPress(oEvent) {

			var value = oEvent.getSource().getCells()[1].getText()
			this.fmodel.setProperty(`${this.getView().getBindingContext().getPath()}/Gender`, value)
			oEvent.getSource().getParent().destroy()
		},
		onCancel(oEvent) {
			this.oDia.destroy()
		},
		clickfile(oEvent) {

			var url = `${this.getOwnerComponent().getModel().sServiceUrl}${oEvent.getSource().getBindingContext().sPath}/$value`;


			window.open(url, '_blank');

			this.oDialog2.destroy()



		},



	});
});