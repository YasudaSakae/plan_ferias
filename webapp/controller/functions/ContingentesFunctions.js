sap.ui.define(["sap/ui/base/ManagedObject",], function (ManagedObject) {
    return ManagedObject.extend("agendamento.telebras.controller.functions.ContingentesFunctions", {
        formatStatus: function (record, context) {
            var oBundle = context.getView().getModel("i18n").getResourceBundle().aPropertyFiles[0];

            if(record.Statp1 == 5
               && record.Statp2 == 5
               && record.Statp3 == 5)
                   return record.Status = oBundle.getProperty("concluido") 

            if(record.Statp1 == 5
               && record.Statp2 == 0
               && record.Statp3 == 0
               && record.Dplan == record.Anzhl)
                   return record.Status = oBundle.getProperty("concluido") 

            if(record.Statp1 == 5
               && record.Statp2 == 0
               && record.Statp3 == 0
               && record.Dplan != record.Anzhl)
                   return record.Status = oBundle.getProperty("pendente") 

            if(record.Statp1 == 5
              && record.Statp2 == 5
              && record.Statp3 == 0
              && record.Dplan == record.Anzhl)
                   return record.Status = oBundle.getProperty("concluido") 

            if(record.Statp1 == 5
              && record.Statp2 == 5
              && record.Statp3 == 0
              && record.Dplan != record.Anzhl)
                   return record.Status = oBundle.getProperty("pendente") 

            if(record.Statp1 != 5 && record.Statp2 != 5 && record.Statp3 != 5) return record.Status = oBundle.getProperty("pendente")  

            if(record.Statp1 != 5 || record.Statp2 != 5 || record.Statp3 != 5) return record.Status = oBundle.getProperty("parcial") 

            if(record.Statp1 == 5 || record.Statp2 == 5 || record.Statp3 == 5) return record.Status = oBundle.getProperty("parcial")
        }
    })
});