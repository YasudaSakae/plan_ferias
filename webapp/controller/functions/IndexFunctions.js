sap.ui.define(
  [
    "sap/ui/base/ManagedObject",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
  ],
  function (ManagedObject, ODataModel, JSONModel, MessageBox) {
    "use strict";

    return ManagedObject.extend(
      "agendamento.telebras.controller.functions.IndexFunctions",
      {
        /**
         * @description Função para preenchimento do Planning Calendar
         * @param {array} aTeamAbsences 
         * @param {array} aTeamInformations 
         * @param {object} oView 
         * @param {object} context 
         */
        fillPlannerCalendar: function (aTeamAbsences, aTeamInformations, oView, context) {
          var oModel = new JSONModel();
          let completeData = { data: [] };
          var that = this;

          var oIntialConfig = {
            people: [],
          };

          aTeamInformations.map((record) => {
            let aPersonAbsence = aTeamAbsences.filter((person) => {
              if (person.Pernr == record.Pernr) {
                let dateStart = new Date(
                  parseInt(person.start.substring(0, 4)),
                  parseInt(person.start.substring(4, 6)) - 1,
                  parseInt(person.start.substring(6, 8)) - 1)
                
                let sumDateStart = dateStart.getDate() + 1
                person.start = new Date(dateStart.setDate(sumDateStart))

                let dateEnd = new Date(
                  parseInt(person.end.substring(0, 4)),
                  parseInt(person.end.substring(4, 6)) - 1,
                  parseInt(person.end.substring(6, 8)) - 1,
                  23,
                  59,
                  59)

                let sumDateEnd = dateEnd.getDate() + 1
                person.end = new Date(dateEnd.setDate(sumDateEnd))
                return person.Pernr == record.Pernr;
              }
            }, this);

            completeData.data.push(record);
            that._fillVisualDetail(aPersonAbsence);
            let name = record.Cname.split(" ");

            oIntialConfig.people.push({
              pic: record.Foto ? `data:image/jpeg;base64,${record.Foto}` : "sap-icon://person-placeholder",
              name: `${name[0]} ${name[1]}`,
              role: record.PlansTx,
              pernr: record.Pernr,
              appointments: aPersonAbsence,
            });
          });

          oModel.setData(oIntialConfig);
          context.getOwnerComponent().getModel("initialBackup").setData(JSON.stringify(oIntialConfig));
          context.getOwnerComponent().getModel("completeData").setData(completeData);
          oView.setModel(oModel);
        },

        /**
         * @description Faz a estilização dos cards de ausência
         * @param {*} aAbsences array de ausências
         */
        _fillVisualDetail: function (aAbsences) {
          for (let record of aAbsences) {
            switch (record.Tipo) {
              case "A":
                record.color = "#F24A33";
                break;
              case "P":
                switch (record.Statp) {
                  case "5":
                    record.color = "#574bdd";
                  case "2":
                    record.color = "#f9fb0b";
                    break;
                  case "4":
                    record.color = "#31c912";
                }
              default:
                record.tentative = false;
            };
            switch (record.Awart) {
              case "9010":
                record.pic = "sap-icon://appointment";
                break;
              case "0291":
                record.pic = "sap-icon://appointment-2";
                break;
              case "0100":
                record.pic = "sap-icon://accelerated";
                break;
              case "0293":
                record.pic = "sap-icon://appointment-2";
                break;
              case "9011":
                record.pic = "sap-icon://appointment";
            }
          }
        },

        /**
         * @description Faz a formatação das datas
         * @param {*} date 
         * @returns 
         */
        formatDate: function (date) {
          // let sDay = this._addDays(date, 1).getDate() < 10 ? `0${this._addDays(date, 1).getDate()}` : this._addDays(date, 1).getDate() + 1;
          let sDay = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
          let sMonth = new Date(date).toLocaleString("pt-BR", {
            month: "long",
          });
          return `${sDay} de ${sMonth} de ${new Date(date).getFullYear()}`;
        },

        /**
         * @description Mostra uma o popup de validação de mensagem
         * @param {string} sMessage 
         */
        showMessageBox: function (sMessage, context) {
          MessageBox.show(sMessage, {
            icon: MessageBox.Icon.INFORMATION,
            title: context._oBundle.getText("PopupTitleMessageBox"),
          });
        },

        /**
         * @description Faz o filtro do registro
         * @param {*} sKeyPernr 
         * @param {*} oView 
         * @returns 
         */
        _filterRecordsByKey: function (sKeyPernr, oView) {
          let oViewData = oView.getModel().getData();
          return oViewData.people.filter((person) => person.pernr == sKeyPernr);
        },

        /**
         * 
         * @returns 
         */
        mssCheck: function () {
          return /mss/.test(window.location.href) ? 1 : 2;
        },

        /**
         * 
         * @param {*} oView 
         * @returns 
         */
        getSelectedRecordCalendar: function (oView) {
          let planningCalendar = oView.byId("PC1");
          let oAppointment = planningCalendar.getSelectedRows()[0];
          let sKeyPernr = oAppointment.getProperty("key");

          let aPersonDetail = this._filterRecordsByKey(sKeyPernr, oView);
          return aPersonDetail;
        },

        /**
         * 
         * @param {*} team 
         * @returns 
         */
        getUserLogged: function (team) {
          return team.filter((person) => person.Pernr == team[0].Userpernr);
        },

        /**
         * @description
         * @param {*} aPersonDetail 
         * @param {*} context 
         * @param {*} isManager 
         */
        navigateToTable: function (aPersonDetail, context, isManager) {
          this._oRouter = sap.ui.core.UIComponent.getRouterFor(context);

          if (isManager) {
            let oGetComplteData = context
              .getOwnerComponent()
              .getModel("completeData")
              .getData();

            sap.ui.getCore()._personDetail = oGetComplteData.data.filter(
              (person) => person.Pernr == aPersonDetail[0].pernr
            );

          } else {
            sap.ui.getCore()._personDetail = aPersonDetail;
          }
          this._oRouter.navTo("Table");
        },

        /**
         * 
         * @param {*} time 
         * @returns 
         */
        _setTime: time => new Date(time.getFullYear(), time.getMonth(), time.getDate() + 1, 1, 0, 0),

        /**
         * 
         * @param {*} date 
         * @param {*} days 
         * @returns 
         */
        _addDays: function (date, days) {
          date.setDate(date.getDate() + days)
          return date
        },
      }
    );
  }
);