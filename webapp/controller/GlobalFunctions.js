sap.ui.define(
  ["sap/ui/base/ManagedObject", 
   "sap/ui/model/odata/v2/ODataModel", "sap/m/Dialog"],
  function (ManagedObject, ODataModel, Dialog) {
    "use strict";

    return ManagedObject.extend("agendamento.telebras.controller.GlobalFunctions",
      {
        /**
        * @description Senhor DEV do Futuro, por favor, deixe este código melhor do que você encontrou!
        *              Obrigado!
        *              Ass: Dev do passado.
        **/
        /**
         * @description Função que faz a configuração do cabeçalho da model para as chamadas dos serviços
         */
        _setConfigurationToServices: function () {
          let oModel = new ODataModel("/sap/opu/odata/sap/ZHR_PLANEJAMENTO_FERIAS_SRV");

          var jsonHeader = {
            "Content-Type": "application/json",
            Accept: "application/json",
            dataType: "JSON",
          };

          oModel.setHeaders(jsonHeader);
          oModel.setUseBatch(false);

          return oModel;
        },

        /**
         * @description Função que recupera os dados do SAP
         * @param {string} serviceURL
         * @param {array} fFilter 
         */
        callServices: function (serviceURL, fFilter) {
          return new Promise((resolve, reject) => {
            let oConfiguredModel = this._setConfigurationToServices();
            if (!fFilter) {
              oConfiguredModel.read(`/${serviceURL}`, {
                success: data => data.results ? resolve(data.results) : resolve(data),
                error: error => reject(error)
              });
            } else {
              oConfiguredModel.read(`/${serviceURL}`, {
                filters: fFilter,
                success: data => resolve(data.results),
                error: error => reject(error)
              });
            }
          });
        },

        /**
         * @description Função que chama o serviço de criação de um novo agendamento
         * @param {string} serviceURL 
         * @param {object} fFilter 
         * @param {object} parameter 
         */
        callServicesCreate: function (serviceURL, fFilter, parameter) {
          return new Promise((resolve, reject) => {
            let oConfiguredModel = this._setConfigurationToServices();
            let data = Object.assign({}, fFilter, parameter)
            oConfiguredModel.create(`/${serviceURL}`, data, {
              urlParameters: parameter,
              success: function (data) {
                resolve(data.results);
              },
              error: function (error) {
                reject(error);
              },
            });
          });
        },

        /**
         * @description Função que chama i serviço de deleção de agendamentos
         * @param {string} serviceURL 
         * @param {object} fFilter 
         */
        callServicesDelete: function (serviceURL, fFilter) {
          return new Promise((resolve, reject) => {
            let oConfiguredModel = this._setConfigurationToServices();
            oConfiguredModel.remove(`/${serviceURL}`, {
              urlParameters: fFilter,
              success: function (data) {
                resolve(data);
              },
              error: function (error) {
                reject(error);
              },
            });
          });
        },

        /**
         * @description Função que faz a chamada do serviço de impressão
         * @param {string} serviceURL 
         * @param {array} fFilter 
         */
        callServicesPrint: function (serviceURL, fFilter) {
          return new Promise((resolve, reject) => {
            let oConfiguredModel = this._setConfigurationToServices();
            oConfiguredModel.read(`/${serviceURL}`, {
              filters: fFilter,
              success: function (data) {
                resolve(data.results);
              },
              error: function (error) {
                reject(error);
              },
            });
          });
        },

        /**
         * @description Função que abre o popup de loading
         * @param {object} context context onde se encontram os objeto para modificação
         */
        openDialog: function (context, text, title, fragment, popOver, referecePopOver) {
          // if (!context._dialog) {
          context._dialog = sap.ui.xmlfragment(`agendamento.telebras.view.fragments.${fragment}`, context);
          context.getView().addDependent(context._dialog);
          // }
          if (!popOver) {
            context._dialog.setText(text)
            context._dialog.setTitle(title)
          }
          jQuery.sap.syncStyleClass("sapUiSizeCompact", context.getView(), context._dialog);
          popOver ? context._dialog.openBy(referecePopOver) : context._dialog.open();
        },

        /**
         * @description Função que fecha o popup de loading
         * @param {object} context context onde se encontram os objeto para modificação
         */
        closeDialog: function (context) {
          context._dialog.close();
          context._dialog.destroy()
        },

        /**
         * @description Função 
         * @param {object} context 
         * @param {string} sMessage 
         */
        openValidationDialog: function (context, sMessage, rightDays) {
          let oBundle = context.getView().getModel("i18n").getResourceBundle();
          var dialog = new Dialog({
            title: oBundle.getText("titlePopup"),
            type: 'Message',
            state: 'Warning',
            content: new sap.m.Text({
              text: oBundle.getText(sMessage).replace('<rightDays>', rightDays)
            }),
            beginButton: new sap.m.Button({
              text: oBundle.getText("ok"),
              press: function () {
                dialog.close();
              }
            }),
            afterClose: function () {
              dialog.destroy();
            }
          });
          dialog.open();
        },

        openErrorMessage: function (context, sMessage, typeState) {
          let oBundle = context.getView().getModel("i18n").getResourceBundle();
          var dialog = new Dialog({
            title: oBundle.getText("titlePopup"),
            type: 'Message',
            state: typeState,
            content: new sap.m.Text({
              text: oBundle.getText(sMessage)
            }),
            beginButton: new sap.m.Button({
              text: oBundle.getText("ok"),
              press: function () {
                dialog.close();
              }
            }),
            afterClose: function () {
              dialog.destroy();
            }
          });
          dialog.open();
        }
      }
    );
  }
);
