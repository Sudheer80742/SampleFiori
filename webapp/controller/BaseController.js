sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/ui/core/message/Message",
    "sap/ui/core/Element"
], function (Controller, MessagePopover, MessageItem, Message, Element) {

    "use strict";

    return Controller.extend("registration.controller.BaseController", {
        capitalizeFirstLetter(oEvent) {
            var str = oEvent.getSource().getValue()
            str = str.charAt(0).toUpperCase() + str.slice(1)
            oEvent.getSource().setValue(str)
        },

        handleMessagePopoverPress: function (oEvent) {
            if (!this._oMP) {
                this._oMP = new MessagePopover({
                    activeTitlePress: function (oEvent) {
                        var oItem = oEvent.getParameter("item"),
                            oMessage = oItem.getBindingContext("message").getObject(),
                            oControl = Element.registry.get(oMessage.getControlId());

                        if (oControl) {
                            if (oControl.isFocusable()) {
                                oControl.focus();
                            }
                        }
                    },
                    items: {
                        path: "message>/",
                        template: new MessageItem({
                            title: "{message>message}",
                            subtitle: "{message>additionalText}",
                            // groupName: { parts: [{ path: 'message>controlIds' }], formatter: this.getGroupName },
                            activeTitle: true,
                            type: "{message>type}",
                            description: "{message>message}"
                        })
                    },
                    groupItems: true
                });
                this.getView().byId("idMessagePopoverBtn").addDependent(this._oMP);
            }
            this._oMP.toggle(oEvent.getSource());
        },

        isPositionable: function (sControlId) {
            // Such a hook can be used by the application to determine if a control can be found/reached on the page and navigated to.
            return sControlId ? true : true;
        },

        removeMessageFromTarget: function (sTarget) {
            this._MessageManager.getMessageModel().getData().forEach(function (oMessage) {
                if (oMessage.target === sTarget) {
                    this._MessageManager.removeMessages(oMessage);
                }
            }.bind(this));
        },

        buttonTypeFormatter: function () {
            var sHighestSeverity;
            var aMessages = this._MessageManager.getMessageModel().oData;
            aMessages.forEach(function (sMessage) {
                switch (sMessage.type) {
                    case "Error":
                        sHighestSeverity = "Negative";
                        break;
                    case "Warning":
                        sHighestSeverity = sHighestSeverity !== "Negative" ? "Critical" : sHighestSeverity;
                        break;
                    case "Success":
                        sHighestSeverity = sHighestSeverity !== "Negative" && sHighestSeverity !== "Critical" ? "Success" : sHighestSeverity;
                        break;
                    default:
                        sHighestSeverity = !sHighestSeverity ? "Neutral" : sHighestSeverity;
                        break;
                }
            });

            return sHighestSeverity;
        },

        // Display the number of messages with the highest severity
        highestSeverityMessages: function () {
            var sHighestSeverityIconType = this.buttonTypeFormatter();
            var sHighestSeverityMessageType;

            switch (sHighestSeverityIconType) {
                case "Negative":
                    sHighestSeverityMessageType = "Error";
                    break;
                case "Critical":
                    sHighestSeverityMessageType = "Warning";
                    break;
                case "Success":
                    sHighestSeverityMessageType = "Success";
                    break;
                default:
                    sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
                    break;
            }

            return this._MessageManager.getMessageModel().oData.reduce(function (iNumberOfMessages, oMessageItem) {
                return oMessageItem.type === sHighestSeverityMessageType ? ++iNumberOfMessages : iNumberOfMessages;
            }, 0) || "";
        },

        // Set the button icon according to the message with the highest severity
        buttonIconFormatter: function () {
            var sIcon;
            var aMessages = this._MessageManager.getMessageModel().oData;

            aMessages.forEach(function (sMessage) {
                switch (sMessage.type) {
                    case "Error":
                        sIcon = "sap-icon://error";
                        break;
                    case "Warning":
                        sIcon = sIcon !== "sap-icon://error" ? "sap-icon://alert" : sIcon;
                        break;
                    case "Success":
                        sIcon = sIcon !== "sap-icon://error" && sIcon !== "sap-icon://alert" ? "sap-icon://sys-enter-2" : sIcon;
                        break;
                    default:
                        sIcon = !sIcon ? "sap-icon://information" : sIcon;
                        break;
                }
            });

            return sIcon;
        },

        _addErrorMessages: function (sMessage, sTargetPath) {
            this._MessageManager.addMessages(
                new Message({
                    message: sMessage,
                    type: "Error",
                    // additionalText: oInput.getLabels()[0].getText(),
                    description: sMessage,
                    target: sTargetPath,
                    processor: this.getView().getModel()
                })
            );
        },

    });
});
