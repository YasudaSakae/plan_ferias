sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "agendamento/telebras/controller/functions/IndexFunctions",
    "agendamento/telebras/controller/GlobalFunctions",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/ui/core/Fragment",
    "sap/m/VBox",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/ui/model/json/JSONModel",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/MessageBox"
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    Controller,
    IndexFunctions,
    GlobalFunctions,
    Filter,
    FilterOperator,
    Dialog,
    Fragment,
    VBox,
    Label,
    Text,
    TextArea,
    Button,
    ButtonType,
    JSONModel,
    SimpleForm,
    MessageBox
  ) {

    "use strict";
    return Controller.extend("agendamento.telebras.controller.Index", {
      /**
      * @description Senhor DEV do Futuro, por favor, deixe este código melhor do que você encontrou!
      *              Obrigado!
      *              Ass: Dev do passado
      **/
      /**
       * @description Evento principal
       */
      onInit: async function () {

        let fullYear = new Date().getFullYear()
        this._setInitialGlobalFunctions();
        this.byId("PC1").setBuiltInViews(["Week", "One Month", "Month"]);

        this.byId("PC1").setMinDate(new Date(new Date().setFullYear(fullYear - 7)));
        this._GlobalFunctions.openDialog(this, this._oBundle.getText("textDialog"), this._oBundle.getText("titleLoad"), "BusyDialog");
        let oDataService = await this._callServicesAndReturnData();

        if (oDataService) {
          await this._IndexFunctions.fillPlannerCalendar(
            oDataService.aTeamAbsences,
            oDataService.aTeamInformations,
            this.getView(),
            this
          );
        }
        this._GlobalFunctions.closeDialog(this);
      },
      /**
       * @description Função que exibe os detalhes do pontamento clicado
       * @param {object} oEvent 
       */
      handleAppointmentSelect: function (oEvent) {

        var sMss = this._IndexFunctions.mssCheck();
        let oAppointment = oEvent.getParameter("appointment");
        this.oProg = oEvent.getParameter("appointment").getBindingContext().getObject();

        if (oAppointment) {
          var startDate = this._IndexFunctions.formatDate(
            oAppointment.getProperty("startDate")
          )

          var endDate = this._IndexFunctions.formatDate(
            oAppointment.getProperty("endDate")
          )

          var json = new JSONModel();
          json.setProperty("/Manager", sMss);
          json.setProperty("/Pernr", this.oProg.Pernr);
          json.setProperty("/Awart", this.oProg.Awart);
          json.setProperty("/Begda", oAppointment.getProperty("startDate"));
          json.setProperty("/Endda", oAppointment.getProperty("endDate"));
          json.setProperty("/Statp", this.oProg.Statp);

          if (!this.oDefaultDialog) {

            if (!this.oDefaultDialog) {
              var oForm = new SimpleForm();

              oForm.addContent(new Label({ text: "Início" }))
              oForm.addContent(new Text({ text: "{path: 'programacao>/Begda', type: 'sap.ui.model.type.Date', formatOptions: { pattern: 'dd.MM.yyyy', UTC: false }}" }))
              oForm.addContent(new Label({ text: "Fim" }))
              oForm.addContent(new Text({ text: "{path: 'programacao>/Endda', type: 'sap.ui.model.type.Date', formatOptions: { pattern: 'dd.MM.yyyy', UTC: false }}" }))
              oForm.addContent(new Label({ text: "Justificativa", labelFor: "id-justificativa" }))
              oForm.addContent(new TextArea({ id: "id-justificativa", value: "{programacao>/Justificativa}", rows: 4, visible: "{= ${programacao>/Manager} === 1 && ${programacao>/Statp} === '2'  ? true : false }" }))

              oForm.addStyleClass("sapUiTinyMarginBeginEnd")
            }

            this.oDefaultDialog = new Dialog({
              title: oAppointment.getTitle(),
              contentWidth: "auto",
              contentHeight: "auto",
              horizontalScrolling: false,
              draggable: true,
              resizable: true,
              content: [
                oForm
              ],
              buttons: [
                new Button({
                  type: ButtonType.Accept,
                  text: "Aprovar",
                  visible: "{= ${programacao>/Manager} === 1 && ${programacao>/Statp} === '2'  ? true : false }",
                  press: function () {
                    this.oDefaultDialog.close();
                    this._aprovarProg();
                  }.bind(this)
                }),
                new Button({
                  type: ButtonType.Reject,
                  text: "Reprovar",
                  visible: "{= ${programacao>/Manager} === 1 && ${programacao>/Statp} === '2'  ? true : false }",
                  press: function () {
                    this._reprovarProg();
                    this.oDefaultDialog.close();
                  }.bind(this)
                }),
                new Button({
                  text: "Fechar",
                  press: function () {
                    this.oDefaultDialog.close();
                  }.bind(this)
                })
              ]
            });
            this.oDefaultDialog.setModel(json, "programacao");

            this.oDefaultDialog.open();

          } else {
            this.oDefaultDialog.setModel(json, "programacao");
            this.oDefaultDialog.setTitle(oAppointment.getTitle());
            this.oDefaultDialog.open();
          }

        }
      },
      /**
 * @description Função que aprova programação de férias
 */
      _aprovarProg: function () {

        var oModel = this.getOwnerComponent().getModel();
        var data = this.oDefaultDialog.getModel("programacao").getData();
        data.Oper = 'A';
        delete data.Manager;
        delete data.Statp;

        oModel.create("/AprovarProgFeriasSet", data, {
          success: this._createSuccess.bind(this),
          error: this._createError.bind(this)
        });

      },
      /**
       * @description Função que retorna sucesso
       */
      _createSuccess: function (oData) {
        MessageBox.success('Programação de férias aprovada com sucesso', {
          onClose: function (sAction) {
            location.reload();
          }.bind(this)
        });        
      },

      /**
       * @description Função que retorna erro
       */
      _createError: function (oError) {
        MessageBox.error("Erro ao aprovar programação de férias");
      },

      _reprovarProg: function () {

        var oModel = this.getOwnerComponent().getModel();
        var data = this.oDefaultDialog.getModel("programacao").getData();
        data.Oper = 'R';
        delete data.Manager;
        delete data.Statp;

        oModel.create("/AprovarProgFeriasSet", data, {
          success: this._createReprovarSuccess.bind(this),
          error: this._createError.bind(this)
        });

      },
      /**
       * @description Função que retorna sucesso
       */
      _createReprovarSuccess: function (oData) {
        MessageBox.success('Requisição reprovada com sucesso', {
          onClose: function (sAction) {
            location.reload();
          }.bind(this)
        });
      },

      /**
       * @description Função que cria regras para navegação
       */
      validateNavigationRules: function () {
        switch (this._edit) {
          case "N":
            /**
             * @param {this._userLogged} Object Dados do usuário
             * @param {this} Object Contexto
             * @param {true} bool validação se o usuário é ou não um gestor
             */
            if (this._userLogged.length > 0) {
              this._IndexFunctions.navigateToTable(this._userLogged, this, false);
            } else {
              this._GlobalFunctions.openErrorMessage(this, this._oBundle.getText("pernrError"), "Error")
            }
            break;
          case "S":
            this._IndexFunctions.navigateToTable(this._IndexFunctions.getSelectedRecordCalendar(this.getView()), this, true);
        }
      },

      /**
       * @description Função para filtro dos tipos de ausencias
       * @param {object} oEvent 
       */
      onChangeFilter: function (oEvent) {
        let oItemSelected = this.byId("select1").getSelectedItem();

        const oIndexDataModelBackup = this.getOwnerComponent().getModel("initialBackup").getData();
        let sKey = oItemSelected.getProperty("key");
        let oIndexModel = this.getView().getModel();
        let oIndexDataModel = JSON.parse(oIndexDataModelBackup);

        if (sKey) {
          oIndexDataModel.people.map(
            (person) =>
            (person.appointments = person.appointments.filter(
              (appointments) => appointments.Awart == sKey
            ))
          );
        }

        // let oInfoFiltered = oIndexDataModel.people.filter(
        //   (person) => person.appointments.length != 0
        // );

        oIndexDataModel.people.map((record) => {
          if (record.appointments.length > 0) {
            record.appointments.map((appointment) => {
              let startDate = appointment.start.split('T' || 't')[0].split('-');
              let endDate = appointment.end.split('T' || 't')[0].split('-');
              appointment.end = new Date(endDate[0], parseInt(endDate[1]) - 1, endDate[2]);
              appointment.start = new Date(startDate[0], parseInt(startDate[1]) - 1, startDate[2]);
            })
          }
        }
        );
        oIndexModel.setData(oIndexDataModel);
        oIndexModel.refresh(true)
      },

      /**
       * @description Função que instancia variáveis globais
       */
      _setInitialGlobalFunctions: function () {
        this._IndexFunctions = new IndexFunctions();
        this._GlobalFunctions = new GlobalFunctions();
        this._formatDate = true
        this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      /**
       * @description Função que busca os dados para preenchimento do calendário
       */
      _callServicesAndReturnData: async function () {
        let _aFilter = new Filter({
          path: "Visao",
          operator: FilterOperator.EQ,
          value1: this._IndexFunctions.mssCheck(),
        });

        try {
          var aTeamInformations = await this._GlobalFunctions
            .callServices(`zhr_recupera_equipeSet`, [_aFilter])
            .then((result) => result)
            .catch((error) => error);
        } catch (error) {
          console.table(error);
        }
        if (aTeamInformations.length != 0) {
          this._userLogged = this._IndexFunctions.getUserLogged(aTeamInformations);
          this._edit = aTeamInformations[0].Atualiza;

          try {
            var aTeamAbsences = await this._GlobalFunctions
              .callServices(`zhr_recupera_ausenciaSet`, [_aFilter])
              .then((result) => result)
              .catch((error) => error);
          } catch (error) {
            console.table(error);
          }

          try {
            var aAbsences = await this._GlobalFunctions
              .callServices("zhr_lista_ausenciasSet", undefined)
              .then((result) => result)
              .catch((error) => error);
            this.getOwnerComponent().getModel("absences_type").setData(aAbsences);
          } catch (error) {
            console.table(error);
          }

          return { aTeamInformations, aTeamAbsences };
        }
      },

      /**
       *@description Função que abre a legenda de cores do calendário
       */
      openLegend: function () {
        let dynamicSideContent = this.byId("DynamicSideContent")
        let isOpen = dynamicSideContent.getShowSideContent()
        dynamicSideContent.setShowSideContent(!isOpen)
      }
    });
  }
);