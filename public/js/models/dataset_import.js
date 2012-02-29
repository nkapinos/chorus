chorus.models.DatasetImport = chorus.models.Base.extend({
    urlTemplate: "workspace/{{workspaceId}}/dataset/{{datasetId}}/import",

    declareValidations: function(newAttrs) {
        if (newAttrs.isNewTable == "true") {
            this.requirePattern("toTable", /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/, newAttrs);
        }

        this.requirePattern("truncate", /^(true|false)$/, newAttrs);
        this.requirePattern("isNewTable", /^(true|false)$/, newAttrs);

        if (newAttrs.useLimitRows) {
            this.requirePositiveInteger("rowLimit", newAttrs);
        }
    },

    initialize: function() {
        this.bind("saved", this.createImportTask, this);
    },

    createImportTask: function() {
        if (this.executeAfterSave) {
            this.importTask = new chorus.models.ImportTask({workspaceId: this.get("workspaceId"), sourceId: this.get("datasetId")});
            this.importTask.save();
        }
    }
});
