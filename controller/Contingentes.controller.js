sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "agendamento/telebras/controller/GlobalFunctions",
    "agendamento/telebras/controller/functions/ContingentesFunctions",
    "agendamento/telebras/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (Controller,
    GlobalFunctions,
    ContingentesFunctions,
    formatter,
    Filter,
    FilterOperator) {
    "use strict";

    return Controller.extend("agendamento.telebras.controller.Contingentes", {

      formatter: formatter,
      /**
       * @description Senhor DEV do Futuro, por favor, deixe este código melhor do que você encontrou!
       *              Obrigado!
       *              Ass: Dev do passado.
       **/

      /**
      * @description Evento principal
      */
      onInit: async function (oEvent) {
        this.getView().addEventDelegate({
          onBeforeShow: async function () {
            this._setInitialGlobalFunctions();
            this._GlobalFunctions.openDialog(this, this._oBundle.getText("textLoadContingentes"), this._oBundle.getText("titleLoad"), "BusyDialog")
            this._setModelData();
            this._GlobalFunctions.closeDialog(this)
          },
        }, this);
      },

      /**
       * @description Função para recuperar o Pernr
       * @returns 
       */
      _recoverPernr: function () {
        return this._DetailFromIndex.Pernr;
      },

      _formatData: function (oModel) {
        oModel.map((record) => {
          record.Anzhl = parseFloat(record.Anzhl).toFixed(1);
          record.Dplan = parseInt(record.Dplan);
          record.Dausen = parseInt(record.Dausen);
          record.Begda = this._formatDate(record.Begda);
          record.Deend = record.Endda

          let splitDate = record.Deend.toLocaleDateString('pt-BR').split('/')
          record.Deend = this._formatDate(new Date(parseInt(splitDate[2]) + 1, parseInt(splitDate[1]) - 1, splitDate[0]));
          record.Desta = this._formatDate(record.Desta);
          record.Endda = this._formatDate(record.Endda);
          this._ContingentesFunctions.formatStatus(record, this);
        }, this);
        return oModel;
      },

      _formatDate: function (date) {
        date = this._addDays(date, 1);
        let sDay = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
        let sMonth = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
        return `${sDay}.${sMonth}.${date.getFullYear()}`;
      },

      _addDays: function (date, days) {
        const dateFormatted = new Date(Number(date))
        dateFormatted.setDate(date.getDate() + days)
        return dateFormatted
      },

      navigateToDetail: function (oEvent) {
        sap.ui.getCore()._personDetail.contingenteData = this.getView().getModel("Contigentes").getData()[oEvent
          .getParameter("id")
          .match(/\d$/)[0]];
        this._oRouter.navTo("Form");
      },

      _setInitialGlobalFunctions: function () {
        this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this._GlobalFunctions = new GlobalFunctions();
        this._ContingentesFunctions = new ContingentesFunctions();
        this._oBundle = this.getView().getModel("i18n").getResourceBundle();
        this._lockNextRecord = false;

        try {
          this._DetailFromIndex = sap.ui.getCore()._personDetail[0];
        } catch (error) {
          console.log(error);
          this._oRouter.navTo("Home")
        }
      },

      _setModelData: async function () {
        let oModelContingente = this.getOwnerComponent().getModel("Contigentes");
        let oModelHeader = this.getOwnerComponent().getModel("Header");
        let filter = []

        filter.push(new Filter({ path: "Pernr", operator: FilterOperator.EQ, value1: await this._recoverPernr() }))
        await this._GlobalFunctions
          .callServices(`zhr_recupera_contingenteSet`, filter)
          .then(async (result) => {
            oModelContingente.setData(await this._lockPeriod(this._formatData(result)));
            oModelContingente.refresh()
          }, this)
          .catch((error) => console.log(error));

        oModelHeader.setData({
          photo: this._DetailFromIndex.pic || `data:image/jpeg;base64,${this._DetailFromIndex.Foto}`,
          name: this._DetailFromIndex.name || this._DetailFromIndex.Cname,
          role: this._DetailFromIndex.role || this._DetailFromIndex.PlansTx,
          email: this._DetailFromIndex.Email.toLowerCase(),
          roleDesc: this._DetailFromIndex.StellTx,
        });
      },

      /**
       * @description Função para tratativa de navegação
       */
      onNavBack: function () {
        window.history.go(-1);
        this._oRouter.getTargets().display("TargetIndex", {
          fromTarget: "TableTarget"
        });
      },

      /**
       * @description Função para trancar o segundo período
       * @param {object} data Detalhes do contingente
       */
      _lockPeriod: function (data) {
        let thereIsMoreThanOneRecord;
        try { thereIsMoreThanOneRecord = data.length > 0 } catch (e) { thereIsMoreThanOneRecord = false }

        if (thereIsMoreThanOneRecord) {
          data.map((record, index) => {
            let setRowType = this.setNavigationTypeRow(record)
            data[index].RowType = setRowType
          })
        } else {
          let setRowType = data[0].Statp1 != 5 || data[0].Statp2 != 5 || data[0].Statp3 != 5 ? "Inactive" : "Navigation";
          if ("Inactive") {
            data[0].RowType = "Navigation";
            try {
              data[1].RowType = setRowType;
            } catch (error) { }
          }
        }

        delete this._lockNextRecord
        return data
      },

      setNavigationTypeRow: function (record) {

        if (record.Status == "Concluído")
           return "Navigation"

        if (this._lockNextRecord) return "Inactive"

        if (record.Statp1 != 5) {
          this._lockNextRecord = true
          return "Navigation"
        }

        if ((record.Statp2 != 5 && record.Statp2 != 0) || (record.Statp3 != 5 && record.Statp3 != 0)) {
          this._lockNextRecord = true
          return "Navigation"
        }

        if ((record.Statp1 == 5 && record.Statp2 == 5 && record.Statp3 == 5) ||
          (record.Statp1 == 5 && record.Statp2 == 5 && record.Statp3 == 0 && record.Dplan != record.Anzhl) ||
          (record.Statp1 == 5 && record.Statp2 == 0 && record.Statp3 == 0 && record.Dplan != record.Anzhl))
            this._lockNextRecord = true
            return "Navigation"
      },

      /**
       * @description Função que abre o aplicativo de email
       */
      onOpenEmail: function () {
        sap.m.URLHelper.triggerEmail(this._DetailFromIndex.Email.toLowerCase(), "Agendamento de Ferias")
      }
    });
  }
);