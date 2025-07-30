sap.ui.define(["sap/ui/model/resource/ResourceModel"], function (ResourceModel) {
    "use strict";

    return {
        statusContingentes: function (status) {
            let _oBundle = new ResourceModel({
                bundleName: "agendamento.telebras.i18n.i18n",
            });
            switch (status) {
                case _oBundle.getProperty("pendente"):
                    return "Error"
                case _oBundle.getProperty("parcial"):
                    return "Warning"
                case _oBundle.getProperty("concluido"):
                    return "Success"
            }
        }
    }
});