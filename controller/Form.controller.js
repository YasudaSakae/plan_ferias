sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "agendamento/telebras/controller/functions/FormFunctions",
    "agendamento/telebras/controller/GlobalFunctions",
    'sap/m/Dialog',
    "sap/m/MessageToast",
    'sap/m/Button',
    'sap/m/Label',
    'sap/m/Text',
  ],
  function (
    BaseController,
    FormFunctions,
    GlobalFunctions,
    Dialog,
    MessageToast,
    Button,
    Label,
    Text
  ) {
    "use strict";

    return BaseController.extend("agendamento.telebras.controller.Form", {
      /**
       * @description Senhor DEV do Futuro, por favor, deixe este código melhor do que você encontrou!
       *              Obrigado!
       *              Ass: Dev do passado.
       **/

      /**
       * @description Evento principal
       */
      onInit: function () {
        this.getView().addEventDelegate({
          onBeforeShow: async function () {
            this._initGlogalVariables();
            this._oReturnData = await this._FormFunctions.callServiceAndRecoverData();
            //    await this._FormFunctions.setInitialMinDateToCalendar(this, this._oReturnData[this._FirstIndex].Dtlim);
            this._fillPeriods(this._oReturnData);
            this._enableFormRule(false);
          },
        }, this);
      },

      /**
       * @description Função que chamada toda vez que a data muda, ela é responsável por construir as regras
       *              De preenchimento da data final
       */
      onChangeDate: async function (oEvent) {
        var idStart = "", idEnd = "", status = "", datePickerParam = oEvent.getParameters().id.match(/datePicker./)[this._FirstIndex];
        let startDate = oEvent.getParameters().newValue.split('.').reverse().join('');
        let pernr = this._DetailFromContingente.Pernr;

        switch (datePickerParam) {
          case "datePicker1":
            idStart = "daysAbsence1"; idEnd = "endAbsence1"; status = "status2";
            break;
          case "datePicker2":
            idStart = "daysAbsence2"; idEnd = "endAbsence2"; status = "status3";
            break;
          case "datePicker3":
            idStart = "daysAbsence3"; idEnd = "endAbsence3"; status = "";
        }

        if (idStart == "daysAbsence1") this._FormFunctions.validateFlag13(this._oReturnData[this._FirstIndex].Flag13, this)

        if (!this.byId(idStart).getValue()) {
          this._errorStartDate(this.byId(idStart), this.byId(datePickerParam))
          return
        }

        try { var checkStatus = this.byId(status).getValue() == "Completo" ? true : false }
        catch (error) { console.error(error) }
        let validateDate = await this._FormFunctions.checkStartDate(this.byId(datePickerParam).getValue(), this.byId(idStart).getValue(), pernr)
          .then((result) => result)
          .catch((error) => error);

        //if (validateDate.flag13Off) {
        //  this.byId(idAdiantamento).setEnabled(false)
        //  this.byId(idAdiantamento).setSelected(false)
        //}
        /**
         * @param {validate.DtValida} string valida se a data digitada é um dia válido para marcação do inicio das férias
         */
        if (validateDate.DtValida) {
          let checkRightDays = 0
          this.byId("abono").getSelected() ? checkRightDays += this._Abono : checkRightDays = 0;

          new Array("daysAbsence1", "daysAbsence2", "daysAbsence3").map(id => {
            if (parseInt(this.byId(id).getValue())) {
              checkRightDays += parseInt(this.byId(id).getValue())
            }
          })

          this.byId(idEnd).setValue(
            await this._FormFunctions.calcEndDate(startDate, this.byId(idStart).getValue())
          );

          if (!this.byId(idStart).getValue() || this.byId(idStart).getValue() < 5) {
            this._errorStartDate(this.byId(idStart), this.byId(datePickerParam));
            return;
          }

          if (checkRightDays < parseInt(this._oReturnData[this._FirstIndex].Anzhl)) {
            if (!checkStatus) this._FormFunctions.enableForm(datePickerParam, this, true);
          } else {
            return;
          }
        } else {
          this._clearFieldsForm(datePickerParam, idStart, idEnd);
          this._FormFunctions.showMessageValidate(this._oBundle.getText("messageValidateStartVacation"));
        }
      },

      /**
       * @description Função que valida a quantidade de dias
       * @param {} oEvent 
       */
      onChange: function (oEvent) {
        let getValue = oEvent.getParameter("newValue");
        var inputId = "", dataPickerId = "", sumAllDays = 0, idEndDate = "";

        new Array("daysAbsence1", "daysAbsence2", "daysAbsence3").map(id => sumAllDays += parseInt(this.byId(id).getValue()) ? parseInt(this.byId(id).getValue()) : 0)

        switch (oEvent.getParameter("id").match(/daysAbsenc.+/)[this._FirstIndex]) {
          case "daysAbsence1":
            inputId = this.byId("daysAbsence1");
            dataPickerId = "datePicker1"
            idEndDate = "endAbsence1"
            //            this._FormFunctions.setFalseNextForm(this.byId("daysAbsence1"), [2, 3], this, this._isEdit);
            break;
          case "daysAbsence2":
            inputId = this.byId("daysAbsence2");
            dataPickerId = "datePicker2"
            idEndDate = "endAbsence2"
            //            this._FormFunctions.setFalseNextForm(this.byId("daysAbsence2"), [3], this, this._isEdit);
            break;
          case "daysAbsence3":
            inputId = this.byId("daysAbsence3");
            dataPickerId = "datePicker3"
            idEndDate = "endAbsence3"
            break;
        }

        new Array(dataPickerId, idEndDate).map(id => this.byId(id).setValue(null))
        sumAllDays += this.byId("abono").getSelected() ? 10 : 0
        if (sumAllDays > 30) {
          inputId.setValueStateText(this._oBundle.getText("validationRightdays"));
          return;
        }
        this._FormFunctions.validateInputStyle(inputId, getValue, dataPickerId, this, sumAllDays);
      },

      _errorStartDate: function (inputId, calendarDate) {
        var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        if (!inputId.getValue()) {
          inputId.setValueStateText(oBundle.getText("validationEmptydays"), this);
        } else if (inputId.getValue() < 5) {
          inputId.setValueStateText(
            "Não é possível fazer agendamento com menos de 5 dias",
            this
          );
        }
        inputId.setValueState("Error");
        calendarDate.setValue(null);
      },

      /**
       * @description Função criar novos agendamentos
       */
      onSave: async function () {
        if (this._FormFunctions.saveValidation(this, this._oReturnData[this._FirstIndex].Anzhl)) {
          if (await this._openDialogConfirmation("saveConfirmation")) {
            this._GlobalFunctions.openDialog(this, this._oBundle.getText("textLoadFormSave"), this._oBundle.getText("titleLoad"), "BusyDialog");
            await this._GlobalFunctions.callServicesCreate('zhr_grava_plan_feriasSet',
              await this._FormFunctions.buildFilters(this.getView()),
              await this._FormFunctions.getFormValues(this.getView())).then((data) => {
                this._GlobalFunctions.closeDialog(this),
                  location.reload();
                //                this.onNavBack()
              }).catch((error) => {
                this._GlobalFunctions.closeDialog(this),
                  this._FormFunctions.showServiceCreateError(error)
              })
          }
        }
      },
      /**
       * @description função que habilita os campos para edição
       */
      onEdit: function (oEvent) {

        // Verifica status para liberar campos para edição, se já tiver aprovado não habilita

        // Período 1
        this.getView().byId("status1").getValue("Em aprovação1122")
        // Período 2

        // Período 3

        /*         const iconEdit = "sap-icon://request";
                const iconCancel = "sap-icon://cancel";
        
                this._isEdit = true
                if (this._buttonStyle) {
                  this._buttonStyle = !this._buttonStyle;
                  this._restyleEditButton("cancelar", "tooltipCancelar", iconCancel)
        
                  if (!this._oldValues) {
                    this._oldValues = {}
                    new Array(
                      "daysAbsence1",
                      "daysAbsence2",
                      "daysAbsence3",
                      "datePicker1",
                      "datePicker3",
                      "datePicker2",
                      "endAbsence1",
                      "endAbsence2",
                      "endAbsence3").map(id => {
                        let oldValue = this.byId(id).getValue();
                        this._oldValues[id] = oldValue;
                      });
                    this._oldValues["abono"] = this.byId("abono").getSelected()
                  }
        
                  // this._oReturnData.map((record, index) => {
                  if (this._oReturnData[0].Statp == 2) {
                    this.byId("abono").setEditable(true).setSelected(false)
                    this.byId(`daysAbsence1`).setEnabled(true)
                    new Array(
                      `daysAbsence1`, `daysAbsence2`, `daysAbsence3`,
                      `datePicker1`, `datePicker2`, `datePicker3`,
                      `endAbsence1`, `endAbsence2`, `endAbsence3`).map(id => this.byId(id).setValue(null))
                    this._FormFunctions.setMinDateCalendar(this, "datePicker", 1, `endAbsence1`)
                    // this._FormFunctions.setMaxDateCalendar(this, "datePicker", index, `endAbsence${index + 1}`);
                  } else {
                    this._oReturnData.map((_, index) => {
                      this.byId(`daysAbsence${++index}`).setEnabled(false)
                      this.byId(`datePicker${index}`).setEnabled(false)
                    });
                  }
                  // })
        
                } else {
                  this._buttonStyle = !this._buttonStyle;
                  this.byId("abono").setEditable(false)
                  this._restyleEditButton("edit", "editVacation", iconEdit);
                  if (!this._oldValues) this._oldValues = []
                  Object.entries(this._oldValues).map(record => {
                    if (record[0] == "abono") return this.byId("abono").setSelected(this._oldValues["abono"])
                    this.byId(record[0]).setValue(record[1])
                  }, this)
                  this.byId("abono").setSelected(this._oldValues["abono"])
                  new Array(0, 1, 2).map((_, index) => {
                    if (index < this._oReturnData.length) {
                      if (this._oReturnData[index].Statp == 2) {
                        this.byId(`daysAbsence${++index}`).setEnabled(false)
                        this.byId(`datePicker${index}`).setEnabled(false)
                      }
                    }
                  });
                } */
      },

      _restyleEditButton: function (text, tooltip, icon) {
        let editButton = this.byId("edit")
        editButton.setText(this._oBundle.getText(text))
        editButton.setTooltip(this._oBundle.getText(tooltip))

        editButton.setIcon(icon)
      },

      /**
       * @description Função para deleção de agendamentos
       */
      onDelete: async function () {
        if (await this._openDialogConfirmation("deleteConfirmation")) {
          let contingenteData = sap.ui.getCore()._personDetail.contingenteData
          let pernr = contingenteData.Pernr
          let begda = contingenteData.Begda.split('.' || '/').reverse().join('')
          let endda = contingenteData.Endda.split('.' || '/').reverse().join('')

          if (!this._FormFunctions.validateRulesToDelete(this, contingenteData)) {
            this._GlobalFunctions.openDialog(this, this._oBundle.getText("textLoadFormDelete"), this._oBundle.getText("titleLoad"), "BusyDialog",)
            await this._GlobalFunctions.callServicesDelete(`zhr_delete_plan_feriasSet(Begda='${begda}',Endda='${endda}',Pernr='${pernr}')`).then(success => success).catch(error => error);
            this._GlobalFunctions.closeDialog(this)
            this.onNavBack()
          } else {
            this._FormFunctions.showMessageValidate(this._oBundle.getText("textDeleteValidationStatus"))
          }
        }
      },

      /**
       * @description Função que faz a impressão do PDF
       */
      onPrintPopOverPrint: function (oEvent) {
        this._GlobalFunctions.openDialog(this, "", "", "PopOverPrint", true, oEvent.getSource())
      },

      /**
       * @description Função que abre o Popup de edição do planejamento
       */
      onPrintPopOverEdit: function (oEvent) {

        if (this._buttonStyle) {
          this._buttonStyle = !this._buttonStyle;
          this._restyleEditButton("cancelar", "tooltipCancelar", iconCancel)
        } else {
          this._buttonStyle = !this._buttonStyle;
          this.byId("abono").setEditable(false)
          this._restyleEditButton("edit", "editVacation", iconEdit);
          if (!this._oldValues) this._oldValues = []
          Object.entries(this._oldValues).map(record => {
            this.byId(record[0]).setValue(record[1])
          }, this)
          new Array(0, 1, 2).map(index => {
            if (this._oReturnData[index].Statp == 2) {
              this.byId(`daysAbsence${++index}`).setEnabled(false)
              this.byId(`datePicker${index}`).setEnabled(false)
            }
          });
        }
      },

      /**
       * @description Função que fecha o popover da tela
       */
      onClosePopOver: function (isEditClose) {
        const iconEdit = "sap-icon://request"
        if (isEditClose) {
          this._restyleEditButton("edit", "editVacation", iconEdit);
        }
        this._GlobalFunctions.closeDialog(this)
      },

      /**
       * @description Função que confirma a impressão do PDF
       */
      onConfirmPrint: async function () {
        /**
         * @description O checkbox é colocado antes para que o app não perca a referencia ao fechoar o popup
         */
        let checkbox1 = sap.ui.getCore().byId("checkbox1p").getSelected()
        let checkbox2 = sap.ui.getCore().byId("checkbox2p").getSelected()
        let checkbox3 = sap.ui.getCore().byId("checkbox3p").getSelected()

        this._GlobalFunctions.closeDialog(this)
        if (await this._FormFunctions.dialogConfirmationWithUserAndPassword(this)) {
          this._GlobalFunctions.openDialog(this, this._oBundle.getText("downladPDF"), this._oBundle.getText("titleLoad"), "BusyDialog")
          if (checkbox1 || checkbox2 || checkbox3) {
            let pdfData = await this._GlobalFunctions.callServicesPrint('zhr_imprime_plan_feriasSet', await this._FormFunctions.buildFIlterPDF([checkbox1, checkbox2, checkbox3], sap.ui.getCore()._personDetail["contingenteData"])).then(success => success).catch(error => console.error(error))
            if (pdfData) await this._FormFunctions.downloadPDF(pdfData)
          }
        }
        this._GlobalFunctions.closeDialog(this)
      },
      handleSelectCheckBox: function (oEvent) {

      },
      onSelectCheckBox: function () {
        let days = 0
        days += this.byId("abono").getSelected() ? 10 : 0;

        new Array("daysAbsence1", "daysAbsence2", "daysAbsence3").map(id => days += parseInt(this.byId(id).getValue()) ? parseInt(this.byId(id).getValue()) : 0)
        if (days <= 30) {
          let datePickerParam = '';
          this._FormFunctions.enableForm(datePickerParam, this, true)
        } else {
          MessageToast.show(this._oBundle.getText("validationRightdays"), {
            duration: 2000
          })
          this.byId("abono").setSelected(false)
        }
      },

      /**
       * @description Função que inicia as variáveis globais
       */
      _initGlogalVariables: function () {
        let oModelHeader = this.getOwnerComponent().getModel("Header");
        let oModelHeaderData = oModelHeader.getData();

        this._FormFunctions = new FormFunctions();
        this._GlobalFunctions = new GlobalFunctions();
        this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this._FirstIndex = 0;
        this._Abono = 10;
        this._buttonStyle = true;
        this._isEdit = false;
        this._oBundle = this.getView().getModel("i18n").getResourceBundle();

        try {
          this._DetailFromContingente = sap.ui.getCore()._personDetail[0];
          oModelHeaderData.fimDeducao = sap.ui.getCore()._personDetail.contingenteData.Deend;
          oModelHeaderData.inicioDeducao = sap.ui.getCore()._personDetail.contingenteData.Desta;
        } catch (error) {
          console.log(error);
          this._oRouter.navTo("Home");
        }

        oModelHeader.refresh(true)
      },

      /**
       * @description Função que limpa os campos da tela
       * @param {*} dataPicker Id do DataPicker
       * @param {string} idStart Data inicio
       * @param {string} idEnd Data fim
       */
      _clearFieldsForm: function (dataPicker, idStart, idEnd) {
        this.byId(dataPicker).setValue("");
        this.byId(idStart).setValue("");
        this.byId(idEnd).setValue("");
      },

      /**
       * @description Função que preenche os formulários da tela
       * @param {object} detailInformations
       */
      _fillPeriods: function (detailInformations) {
        var idStart = "", idEnd = "", status = "", idAdiantamento = "", checkBoxAbonoId = "abono";

        detailInformations.sort((record) => record.Perio);
        new Array("datePicker1", "datePicker2", "datePicker3").map((form, index) => {
          if (!detailInformations[index]) return;
          let iCastDay = parseInt(detailInformations[index].Leday);

          switch (form) {
            case "datePicker1":
              idStart = "daysAbsence1";
              idEnd = "endAbsence1";
              status = "status1";
              idAdiantamento = "adiantamento1";
              break;
            case "datePicker2":
              idStart = "daysAbsence2";
              idEnd = "endAbsence2";
              status = "status2";
              idAdiantamento = "adiantamento2";
              break;
            case "datePicker3":
              idStart = "daysAbsence3";
              idEnd = "endAbsence3";
              status = "status3";
              idAdiantamento = "adiantamento3";
          }


          this.byId(status).setValue(detailInformations[index].Statptx);
          this.byId(idStart).setValue(iCastDay);
          this.byId(form).setValue(this._FormFunctions.formatDate(detailInformations[index].Lebeg));
          this.byId(idEnd).setValue(this._FormFunctions.formatDate(detailInformations[index].Leend));
          this.byId(idAdiantamento).setSelected(detailInformations[index].Optxb ? true : false);
          this.byId(checkBoxAbonoId).setSelected(detailInformations[index].Abono ? true : false);

          // Deixar os campos bloqueados caso status seja 4 (Aprovado)
          if (detailInformations[index].Statp === '4') {
            this.byId(idStart).setEnabled(false);
            this.byId(form).setEnabled(false);
            this.byId(idAdiantamento).setEnabled(false);
          }
          // Deixar os campos bloqueados caso status seja 5 (Concluido)
          if (detailInformations[index].Statp === '5') {
            this.byId(idStart).setEnabled(false);
            this.byId(form).setEnabled(false);
            this.byId(idAdiantamento).setEnabled(false);
          }
        }, this);

        this.byId(checkBoxAbonoId).setEditable(!detailInformations[this._FirstIndex].Statptx ? true : false);
        this.byId("edit").setEnabled(this.byId(status).getValue() ? true : false)

        this._FormFunctions.validateFlag13(detailInformations[this._FirstIndex].Flag13, this)
        this._FormFunctions.validateIfPrintWillEnabled(this, detailInformations)
        this._FormFunctions.enableCheckBoxFromPopOverPrint(this, detailInformations)
        this._FormFunctions.enableCheckBoxFromPopOverEdit(this)
      },

      /**
       * @description Função que valida se um form vai ser habilitado
       * @param {boolean} isOnChangeDateEvent 
       */
      _enableFormRule: function (isOnChangeDateEvent) {
        let getValueStatus1 = this.byId("status1").getValue() ? true : false
        let getValueStatus2 = this.byId("status2").getValue() ? true : false
        let getValueStatus3 = this.byId("status3").getValue() ? true : false

        if (!getValueStatus1) {
          this._FormFunctions.enableForm("daysAbsence1", this, isOnChangeDateEvent);
        }
        var x, bPerio1 = false, bPerio2 = false, bPerio3 = false;
        for (x in this._oReturnData) {
          switch (this._oReturnData[x].Perio) {
            case '1':
              bPerio1 = true;
              break;
            case '2':
              bPerio2 = true;
              break;
            case '3':
              bPerio3 = true;
              break;

            default:
              break;
          }
        }

        if (!bPerio2) {
          //          this._FormFunctions.enableForm("daysAbsence2", this, isOnChangeDateEvent);
          this.byId("status2").setValue("");
          this.byId("daysAbsence2").setValue("");
          this.byId("datePicker2").setValue("");
          this.byId("endAbsence2").setValue("");
          this.byId("adiantamento2").setSelected(false);
        }
        if (!bPerio3) {
          this.byId("status3").setValue("");
          this.byId("daysAbsence3").setValue("");
          this.byId("datePicker3").setValue("");
          this.byId("endAbsence3").setValue("");
          this.byId("adiantamento3").setSelected(false);
        }
      },

      /**
       * @description Função que retorna a página anterior
       */
      onNavBack: function () {
        window.history.go(-1);
        //        this._FormFunctions.clearFields(this)
        //        this._restyleEditButton("edit", "editVacation", "sap-icon://request");
      },

      /**
       * @description Função que abre o aplicativo de email
       */
      onOpenEmail: function () {
        sap.m.URLHelper.triggerEmail(this._DetailFromContingente.Email.toLowerCase(), "#Agendamento de Ferias")
      },

      /**
       * @description Dialogo de confimarção
       * @param {*} message 
       * @returns 
       */
      _openDialogConfirmation: function (message) {
        return new Promise((resolve, reject) => {
          var dialog = new Dialog({
            title: this._oBundle.getText("titlePopup"),
            type: 'Message',
            content: new sap.m.Text({ text: this._oBundle.getText(message) }),
            beginButton: new sap.m.Button({
              text: this._oBundle.getText("confirm"),
              press: function () {
                dialog.close();
                resolve(true);
              }
            }),
            endButton: new sap.m.Button({
              text: this._oBundle.getText("cancelar"),
              press: function () {
                dialog.close();
                reject(false)
              }
            }),
            afterClose: function () {
              dialog.destroy();
            }
          });
          dialog.open();
        })

      },
    });
  },
  /* bExport= */ true
);