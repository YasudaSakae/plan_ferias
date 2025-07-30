sap.ui.define(
  [
    "sap/ui/base/ManagedObject",
    "agendamento/telebras/controller/GlobalFunctions",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/Input",
    'sap/m/Dialog',
    "sap/m/MessageToast",
    'sap/m/Button',
    'sap/m/Label',
    'sap/m/Text',
    "sap/m/HBox",
    "sap/m/MessageStrip",
    "sap/m/BusyDialog",
  ],
  function (ManagedObject,
    GlobalFunctions,
    Filter,
    FilterOperator,
    MessageBox,
    Input,
    Dialog,
    MessageToast,
    Button,
    Label,
    Text,
    HBox,
    MessageStrip,
    BusyDialog) {
    "use strict";

    return ManagedObject.extend(
      "agendamento.telebras.controller.functions.FormFunctions",
      {
        /**
         * @override
         * @description Construtor para iniciar variáveis globais
         */
        constructor: function () {
          if (!this._GlobalFunctions) {
            this._GlobalFunctions = new GlobalFunctions();
          }
        },

        /**
         * @description Função que formata datas concatenando 0 para uma formatação mais coerente
         * @param {*} date Data que será formatada
         * @returns 
         */
        formatDateComplex: function (date) {
          let sDay = new Date(date).getDate() + 1 < 10 ? `0${new Date(date).getDate() + 1}` : new Date(date).getDate() + 1;
          let sMonth = new Date(date).getMonth() < 10 ? `0${new Date(date).getMonth()}` : new Date(date).getMonth();
          return `${sDay}/${sMonth}/${new Date(date).getFullYear()}`;
        },

        /**
         * @description Função Para formatação da data inicio antes de chamar o serviço que calcula
         *              A data final do período de férias
         * @param {*} date Data de inicio do período de férias
         * @param {*} days Quantidade de dias de férias
         */
        calcEndDate: async function (date, days) {
          let formatToSAP = date.split("-").join("");
          return this.formatDate(await this._callServiceDate(formatToSAP, days));
        },

        /**
         * @description Serviço que calcula a data final do período de férias
         * @param {*} formatToSAP Data no formato do SAP
         * @param {*} days Quantidade de dias escolhido pelo funcionário
         */
        _callServiceDate: async function (formatToSAP, days) {
          if (/\//.test(formatToSAP)) formatToSAP = formatToSAP.split("/").reverse().join("");
          return await this._GlobalFunctions.callServices(`zhr_soma_dataSet(Data='${formatToSAP},${days}')`, undefined)
            .then((result) => result)
            .catch((error) => error);
        },

        /**
         * @description Função para formatação de data no formato dia/mês/ano
         * @param {*} sDate Data
         */
        formatDate: function (sDate) {
          if (!sDate) return;
          let year = sDate.substring(0, 4), month = sDate.substring(4, 6), day = sDate.substring(6, 8);
          return `${day}/${month}/${year}`;
        },

        /**
         * @description Função que habilita os forulários dinâmicamente
         * @param {string} dateParam Id do obejto modificado
         * @param {object} context context onde se encontram os objeto para modificação
         * @param {boolean} isOnChangeDateEvent 
         */
        enableForm: function (dateParam, context, isOnChangeDateEvent) {
          let getNextFormToEnable = isOnChangeDateEvent ? 1 : 0
          let id = parseInt(dateParam.match(/\d$/)) + getNextFormToEnable;
          if (!id) id = 1;

          if (id && (id != 4 && id != 5) ) {
            let form = context.byId(`datePicker${id}`);
            let absence = context.byId(`daysAbsence${id}`);

            absence.setEnabled(true);

            let previousId = --id
            let idValidate = previousId < 1 || !previousId ? 1 : previousId;
            let getDate = context.byId(`endAbsence${idValidate}`).getValue().split("/" || ".");

            if (getDate.length <= 1) {
              getDate = []
              getDate.push(context._oReturnData[0].Dtlim.substring(6, 8))
              getDate.push(context._oReturnData[0].Dtlim.substring(4, 6))
              getDate.push(context._oReturnData[0].Dtlim.substring(0, 4))
            }

//            form.setMinDate(new Date(parseInt(getDate[2]), parseInt(getDate[1]) - 1, parseInt(getDate[0]) + 1));
          }
        },

        /**
         * @description Função que fixa a a data inicial do calendário do primeiro form
         * @param {object} context context onde se encontram os objeto para modificação
         * @param {*} initialDate 
         */
        setInitialMinDateToCalendar: async function (context, initialDate) {
          context.byId("datePicker1")
            .setMinDate(new Date(initialDate.substring(0, 4), initialDate.substring(5, 6), initialDate.substring(7, 8)));
        },

        /**
         * @description Função que captura os dados para preenchimento dos formulários
         * @returns 
         */
        callServiceAndRecoverData: async function () {
          let fFilter = new Array();
          let pernr = sap.ui.getCore()._personDetail[0].Pernr
          let begda = sap.ui.getCore()._personDetail["contingenteData"].Begda.split('.' || '/').reverse().join('')
          let endda = sap.ui.getCore()._personDetail["contingenteData"].Endda.split('.' || '/').reverse().join('')

          fFilter.push(
            new Filter({
              path: "Pernr",
              operator: FilterOperator.EQ,
              value1: pernr,
            })
          );

          fFilter.push(
            new Filter({
              path: "Begda",
              operator: FilterOperator.EQ,
              value1: begda,
            })
          );

          fFilter.push(
            new Filter({
              path: "Endda",
              operator: FilterOperator.EQ,
              value1: endda,
            })
          );

          return await this._GlobalFunctions.callServices(
            `zhr_recupera_plan_feriasSet`,
            fFilter
          ).then((result) => result).catch((error) => console.table(error));
        },

        /**
         * @description Função que verifica se a data inicial é uma data válida para inicio de férias
         * @param {*} startDate Inicio das férias
         * @param {*} quantDate Quantidade de dias
         * @param {*} pernr Pernr do usuário
         */
        checkStartDate: async function (startDate, quantDate, pernr) {
          startDate = startDate.split('.').reverse().join('')
          return await this._GlobalFunctions.callServices(
            `zhr_valida_dataSet(Pernr='${pernr}',Begda='${startDate
              .split("/")
              .reverse()
              .join("")}',Dias='${quantDate}')`,
            /**@description Enviado filtro vazio */
            undefined
          ).then((result) => result).catch((error) => error);
        },

        /**
         * @description Função para exibição de mensagens Warning
         * @param {string} sMessage Texto do popup
         */
        showMessageValidate: sMessage => MessageBox.warning(sMessage, { title: 'Atenção' }),

        /**
         * @description Função para desabilitar formulários
         * @param {object} days Qnatidade de dias
         * @param {array} fieldId Id do Campo
         * @param {object} context context onde se encontram os objeto para modificação
         */
        setFalseNextForm: function (days, fieldId, context, isEdit) {
          fieldId.map(id => {
            context.byId(`daysAbsence${id}`).setEnabled(false)
            context.byId(`datePicker${id}`).setEnabled(false)
            context.byId(`daysAbsence${id}`).setValue(null)
            context.byId(`datePicker${id}`).setValue(null)
            context.byId(`endAbsence${id}`).setValue(null)
          })
          // }
        },

        /**
         * @description Função que valida o valor do campo de dias de férias
         * @param {string} inputId ID do objeto
         * @param {*} getValue 
         * @param {object} context context onde se encontram os objeto para modificação
         */
        validateInputStyle: function (inputId, days, datePickerId, context, sumAllDays) {
          // let isLessThan14 = days && days < 5 ||
          //   days > parseInt(context._oReturnData[context._FirstIndex].Anzhl) ||
          //   sumAllDays > parseInt(context._oReturnData[context._FirstIndex].Anzhl) ? "Error" : "None";

          // if (days < 5) {
          //   inputId.setValueStateText(context._oBundle.getText("validation5days"));
          // } else if (days > parseInt(context._oReturnData[context._FirstIndex].Anzhl) ||
          //   sumAllDays > parseInt(context._oReturnData[context._FirstIndex].Anzhl)) {
          //   inputId.setValueStateText(context._oBundle.getText("validationRightdays"));
          // } else if (days == parseInt(context._oReturnData[context._FirstIndex].Anzhl)) {
          //   inputId.setValueStateText(context._oBundle.getText("validationCompleteDaysRight"));
          //   isLessThan14 = "Warning";
          // }

          // let daysValidation = days >= 5 && sumAllDays <= parseInt(context._oReturnData[context._FirstIndex].Anzhl);
          // if ((isLessThan14 == "None" || isLessThan14 == "Warning") && daysValidation) {
          //   context.byId(datePickerId).setEnabled(true)
          // } else {
          //   let getId = datePickerId.match(/\d$/)[0]
          //   context.byId(datePickerId).setEnabled(false)
          //   if (!days) {
          //     if (!context._isEditFunction) {
          //       context._clearFieldsForm(datePickerId, `endAbsence${getId}`, `daysAbsence${getId}`)
          //     }
          //   }
          // }
          // inputId.setValueState(isLessThan14);
        },

        /**
         * @description Função que monta o filtros de informações para enviar ao SAP ao salvar 
         * @param {object} context context onde se encontram os objeto para modificação
         */
        buildFilters: function (context) {
          let contingenteData = sap.ui.getCore()._personDetail.contingenteData;
          
          return {
            Begda: contingenteData.Begda.split('.' || '/').reverse().join(''),
            Endda: contingenteData.Endda.split('.' || '/').reverse().join(''),
            Abono: context.byId("abono").getSelected() ? "X" : "",
            Flag13: context.byId("adiantamento1").getSelected() ? "X" : "",
            Pernr: contingenteData.Pernr
          }
        },

        /**
         * @description Função que valida os dados antes de salvar o agendamento
         * @param {object} context context onde se encontram os objeto para modificação
         */
        saveValidation: function (context, rightDays) {
          let isCompletlyFilled = 0;

          context.byId("abono").getSelected() ? isCompletlyFilled += context._Abono : isCompletlyFilled = 0;
          let thereIsSome14Days = false;

          new Array("daysAbsence1", "daysAbsence2", "daysAbsence3").map(id => {
            let currentValue = parseInt(context.getView().byId(id).getValue())
            if (currentValue) isCompletlyFilled += currentValue
          })
          // if (isCompletlyFilled < parseInt(rightDays)) {
          //   this._GlobalFunctions.openValidationDialog(context, "textSaveLessThanRightDays", parseInt(rightDays))
          //   this.clearFields(context, true)
          //   context._GlobalFunctions.closeDialog(context)
          //   return false;
          // }

          new Array("daysAbsence1", "daysAbsence2", "daysAbsence3").map(id => {
            if (!thereIsSome14Days) {
              context.getView().byId(id).getValue() >= 14 ? thereIsSome14Days = true : thereIsSome14Days = false;
            }
          });
          // if (!thereIsSome14Days) {
          //   this._GlobalFunctions.openValidationDialog(context, "message14daysvalidation", null)
          //   this.clearFields(context, true)
          //   context._GlobalFunctions.closeDialog(context)
          //   return false;
          // }

          // if (isCompletlyFilled > rightDays) {
          //   this._GlobalFunctions.openValidationDialog(context, "validationRightdaysSum", null)
          //   this.clearFields(context, true)
          //   context._GlobalFunctions.closeDialog(context)
          //   return false;
          // }

          return true;
        },

        /**
         * @description Função que captura o valor dos campos da tela
         * @param {object} context  context onde se encontram os objeto para modificação
         */
        getFormValues: function (context) {
          let form1 = {
            Dias: context.byId("daysAbsence1").getValue(),
            Dtini: context.byId("datePicker1").getValue().split(this._formatSeparator("datePicker1", context)).reverse().join(''),
            Dtfim: context.byId("endAbsence1").getValue().split(this._formatSeparator("endAbsence1", context)).reverse().join(''),
            Flag13: context.byId("adiantamento1").getSelected() ? 'X' : ''
          }, form2 = {
            Dias2: context.byId("daysAbsence2").getValue(),
            Dtini2: context.byId("datePicker2").getValue().split(this._formatSeparator("datePicker2", context)).reverse().join(''),
            Dtfim2: context.byId("endAbsence2").getValue().split(this._formatSeparator("endAbsence2", context)).reverse().join(''),
            Flag132: context.byId("adiantamento2").getSelected() ? 'X' : ''            
          }, form3 = {
            Dias3: context.byId("daysAbsence3").getValue(),
            Dtini3: context.byId("datePicker3").getValue().split(this._formatSeparator("datePicker3", context)).reverse().join(''),
            Dtfim3: context.byId("endAbsence3").getValue().split(this._formatSeparator("endAbsence3", context)).reverse().join(''),
            Flag133: context.byId("adiantamento3").getSelected() ? 'X' : ''            
          }
          return Object.assign({}, form1, form2, form3);
        },

        /**
         * @description Função que monta um separador de datas
         */
        _formatSeparator: (id, context) => context.byId(id).getValue().includes('/') ? '/' : '.',

        /**
         * @description Função que faz a validação das regras de exclusão do agendamento de férias
         * @param {object} context  context onde se encontram os objeto para modificação
         */
        validateRulesToDelete: function (context, contingenteData) {
          let thereIsCompltedStatus = false;
          new Array("Statp1", "Statp2", "Statp3").map(status => {
            if (contingenteData[status] == 5 || contingenteData[status] == 4) {
              thereIsCompltedStatus = true;
            }
          })
          return thereIsCompltedStatus;
        },

        /**
         * @description 
         * @param {object} context  context onde se encontram os objeto para modificação
         */
        validateIfPrintWillEnabled: function (context, detailInformations) {
          let buttonPrintId = "print"
          detailInformations.map(record => record.Statp == 5 ? context.byId(buttonPrintId).setEnabled(true) : null)
        },

        /**
         * @description 
         * @param {object} context  context onde se encontram os objeto para modificação
         */
        enableCheckBoxFromPopOverPrint: function (context, formData) {
          try { var checkbox1 = formData[0].Statp == 5 ? true : false } catch (error) {
            checkbox1 = false
          }
          try { var checkbox2 = formData[1].Statp == 5 ? true : false } catch (error) {
            checkbox2 = false
          }
          try { var checkbox3 = formData[2].Statp == 5 ? true : false } catch (error) {
            checkbox3 = false
          }
          let oJson = new sap.ui.model.json.JSONModel({
            checkbox1: checkbox1,
            checkbox2: checkbox2,
            checkbox3: checkbox3
          })

          context.getView().setModel(oJson, "checkboxprint")
        },

        /**
         * @description 
         * @param {object} context  context onde se encontram os objeto para modificação
         */
        enableCheckBoxFromPopOverEdit: function (context) {
          try { var checkbox1 = context.byId("status1").getValue() != "Completo" ? true : false } catch (error) {
            checkbox1 = false
          }
          try { var checkbox2 = context.byId("status2").getValue() != "Completo" ? true : false } catch (error) {
            checkbox2 = false
          }
          try { var checkbox3 = context.byId("status3").getValue() != "Completo" ? true : false } catch (error) {
            checkbox3 = false
          }
          let oJson = new sap.ui.model.json.JSONModel({
            checkbox1: checkbox1,
            checkbox2: checkbox2,
            checkbox3: checkbox3
          })

          context.getView().setModel(oJson, "checkboxedit")
        },

        /**
         * @description 
         * @param {array} checkbox 
         * @param {array} contingenteData 
         * @returns 
         */
        buildFIlterPDF: function (checkbox, contingenteData) {
          let filter = []
          let pernr = sap.ui.getCore()._personDetail[0].Pernr
          let checkbox1 = checkbox[0] ? "X" : ""
          let checkbox2 = checkbox[1] ? "X" : ""
          let checkbox3 = checkbox[2] ? "X" : ""
          filter.push(new Filter({ path: "Pernr", operator: FilterOperator.EQ, value1: pernr }))
          filter.push(new Filter({ path: "Begda", operator: FilterOperator.EQ, value1: contingenteData.Begda.split('.' || '/').reverse().join('') }))
          filter.push(new Filter({ path: "Endda", operator: FilterOperator.EQ, value1: contingenteData.Endda.split('.' || '/').reverse().join('') }))
          filter.push(new Filter({ path: "Flag1", operator: FilterOperator.EQ, value1: checkbox1 }))
          filter.push(new Filter({ path: "Flag2", operator: FilterOperator.EQ, value1: checkbox2 }))
          filter.push(new Filter({ path: "Flag3", operator: FilterOperator.EQ, value1: checkbox3 }))
          return filter;
        },

        /**
         * @description Limpa o valor dos campos da tela
         * @param {object} context context onde se encontram os objeto para modificação
         * @param {boolean} error verifica se é uma validação de erro
         */
        clearFields: function (context, error) {
          new Array(
            "status1", "status2", "status3",
//            "endAbsence1", "endAbsence2", "endAbsence3",
            "datePicker1", "datePicker2", "datePicker3",
            "daysAbsence1", "daysAbsence2", "daysAbsence3",
          ).map(id => {
            if (!error && "status1") {
              context.byId(id).setValue(null)
              //context.byId(id).setEnabled(false)                     
              context.byId(id).setEnabled(true)
            }
          })
          new Array("datePicker1", "datePicker2", "datePicker3").map(id => context.byId(id).setValueState("None"))
        },

        /**
         * @description Faz o download do arquivo PDF
         * @param {array} data Dados do PDF
         */
        downloadPDF: function (data) {
          var link = document.createElement("a");
          let nameFile = "Planejamento"
          data.map(record => {
            record.Pdf
            link.download = `${nameFile}.pdf`;
            link.href = "data:application/octet-stream;base64," + record.Pdf;
            window.locate = "#";
            document.body.appendChild(link);
            link.click();
          })
        },

        /**
         * @description Configura a data mínima do calendário
         * @param {object} context 
         * @param {*} id 
         * @param {*} index 
         * @param {*} endDate 
         * @returns 
         */
        setMinDateCalendar: function (context, id, index, endDate) {
          if (index - 1 == 0) {
            let date = new Date()
            date = this._addDays(date, parseInt(context._oReturnData[0].Qtdedias))
            context.byId(`${id}${index}`).setMinDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()))
            return;
          };
          let splitedDate = context.byId(endDate).getValue().split('/') || []
          if (splitedDate.length > 0 && splitedDate[0]) {
            let date = this._addDays(new Date(splitedDate[2], splitedDate[1], splitedDate[0]), 1)
            context.byId(`${id}${index}`).setMinDate(new Date(date.getFullYear(), date.getMonth() - 1, date.getDate()))
          }
        },

        _addDays: function (date, days) {
          const copy = new Date(Number(date))
          copy.setDate(date.getDate() + days)
          return copy
        },

        /**
         * @description Função responsável po habilitar o flag de 13° salário
         * @param {string} flag13 
         * @param {object} context 
         */
        validateFlag13: function (flag13, context) {
          flag13 = flag13.split('.').reverse();
          var badia1 = true;
          var badia2 = true;
          var badia3 = true;          
          const datePicker = context.byId("datePicker1").getValue().split('/').reverse();
          let datePickerOnScreenGetTime = new Date(datePicker[0], datePicker[1], datePicker[2]).getTime()
          let datePickerOnScreen = datePickerOnScreenGetTime ? datePickerOnScreenGetTime : 0;

          let todayDate = new Date().getTime()
          let dateSendedByBackend = new Date(flag13[0], flag13[1], flag13[2]).getTime();

          if (todayDate > dateSendedByBackend || datePickerOnScreen > dateSendedByBackend) {
            return context.byId("adiantamento1").setEnabled(false), context.byId("adiantamento2").setEnabled(false), context.byId("adiantamento3").setEnabled(false)
          } else {
            if(context.byId("adiantamento1").getEnabled() === false ){
              badia1 = false;
            }
            if(context.byId("adiantamento2").getEnabled() === false ){
              badia2 = false;
            }
            if(context.byId("adiantamento3").getEnabled() === false ){
              badia3 = false;
            }                        
            return context.byId("adiantamento1").setEnabled(badia1), context.byId("adiantamento2").setEnabled(badia2), context.byId("adiantamento3").setEnabled(badia3)
          }
        },

        /**
         * @description Função que cria dialogo de cconfirmação de usuário e senha
         * @param {object} context 
         */
        dialogConfirmationWithUserAndPassword: async function (context) {
          var result = true;


          return result;
        },
        showServiceCreateError: function(error){

          MessageBox.error(JSON.parse(error.responseText).error.message.value)
        }
      }
    );
  },
);