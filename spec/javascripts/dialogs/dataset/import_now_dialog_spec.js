jasmine.sharedExamples.importIntoNewTableIsSelected = function() {
    it("should disable the destination dataset picker link", function() {
        expect(this.dialog.$(".existing_table a.dataset_picked")).toHaveClass('hidden');
        expect(this.dialog.$(".existing_table span.dataset_picked")).not.toHaveClass('hidden');
    });

    it("should disable the truncate option", function() {
        expect(this.dialog.$(".truncate")).toBeDisabled();
    });
};

describe("chorus.dialogs.ImportNow", function() {
    beforeEach(function() {
        this.dataset = rspecFixtures.workspaceDataset.datasetTable();
        this.importSchedules = rspecFixtures.datasetImportScheduleSet();
        _.extend(this.importSchedules.attributes, {
            datasetId: this.dataset.get('id'),
            workspaceId: this.dataset.get("workspace").id
        });
        this.importSchedule = this.importSchedules.at(0);
        this.importSchedule.set({
            datasetId: this.dataset.get('id'),
            workspaceId: this.dataset.get('workspace').id,
            destinationDatasetId: 789
        });
        this.workspace = rspecFixtures.workspace(this.dataset.get('workspace'));
        this.importSchedule.unset('sampleCount');

        this.dialog = new chorus.dialogs.ImportNow({
            dataset: this.dataset,
            workspace: this.workspace
        });
    });

    context("with an existing import", function() {
        beforeEach(function() {
            this.importSchedule.set({
                destinationTable: "foo",
                objectName: "bar"
            });
            this.server.completeFetchFor(this.dataset.getImportSchedules(), this.importSchedules.models);
            this.dialog.render();
            this.dialog.$(".new_table input.name").val("good_table_name").trigger("keyup");
            expect(this.dialog.$("button.submit")).toBeEnabled();
        });

        it("does a post when the form is submitted", function() {
            this.dialog.$("button.submit").click();
            expect(this.server.lastCreate().url).toContain('import');
        });

        context("when 'Import into Existing Table' is checked", function() {
            beforeEach(function() {
                this.dialog.$(".new_table input:radio").prop("checked", false);
                this.dialog.$(".existing_table input:radio").prop("checked", true).change();
            });

            it("should enable the 'select destination table' link", function() {
                expect(this.dialog.$(".existing_table a.dataset_picked")).not.toHaveClass("hidden");
                expect(this.dialog.$(".existing_table span.dataset_picked")).toHaveClass("hidden");
            });

            context("when clicking the dataset picker link", function() {
                beforeEach(function() {
                    stubModals();
                    this.dialog.$(".existing_table a.dataset_picked").click();
                });

                it("should have a link to the dataset picker dialog", function() {
                    expect(this.dialog.$(".existing_table a.dataset_picked")).toContainTranslation("dataset.import.select_dataset");
                });

                it("should set the pre-selected dataset if there is one", function() {
                    expect(chorus.modal.options.defaultSelection.attributes).toEqual(this.importSchedule.destination().attributes);
                });
            });
        });
    });

    context("without an existing scheduled import", function() {
        beforeEach(function() {
            this.importSchedule.set({
                toTable: null
            });
            this.server.completeFetchFor(this.dataset.getImportSchedules(), []);
            this.dialog.render();
        });

        it("should initialize its model with the correct datasetId and workspaceId", function() {
            expect(this.dialog.model.get("datasetId")).toBe(this.dataset.get("id"));
            expect(this.dialog.model.get("workspaceId")).toBe(this.dataset.get("workspace").id);
        });

        describe("the initial state", function() {
            itBehavesLike.importIntoNewTableIsSelected();

            it("should have the correct title", function() {
                expect(this.dialog.title).toMatchTranslation("import.title");
            });

            it("should hide the schedule controls", function() {
                expect(this.dialog.$(".schedule_widget")).not.toExist();
            });

            it("should display the import destination", function() {
                expect(this.dialog.$(".destination")).toContainTranslation("import.destination", {canonicalName: this.workspace.sandbox().schema().canonicalName()});
            });

            describe("the new table section", function() {
                it("should have an 'Import into new table' radio button", function() {
                    expect(this.dialog.$(".new_table label")).toContainTranslation("import.new_table");
                });

                it("selects 'import into new table' by default", function() {
                    expect(this.dialog.$(".new_table input:radio")).toBeChecked();
                });

                it("should have a text entry for new table name", function() {
                    expect(this.dialog.$(".new_table .name")).toBeEnabled();
                });
            });

            describe("the existing table section", function() {
                it("should have an 'Import into an existing table' radio button", function() {
                    expect(this.dialog.$(".existing_table label")).toContainTranslation("import.existing_table");
                });

                it("should have an import into existing table radio button", function() {
                    expect(this.dialog.$(".existing_table label")).toContainTranslation("import.existing_table");
                });
            });

            describe('options',function () {
                it("should have a 'Limit Rows' checkbox", function() {
                    expect(this.dialog.$(".limit label")).toContainTranslation("import.limit_rows");
                    expect(this.dialog.$(".limit input:checkbox")).not.toBeChecked();
                });

                it("should have a disabled textfield for the 'Limit Rows' value", function() {
                    expect(this.dialog.$(".limit input:text")).toBeDisabled();
                });
            });

            it("should have a disabled 'Begin Import' button", function() {
                expect(this.dialog.$("button.submit")).toContainTranslation("import.begin");
                expect(this.dialog.$("button.submit")).toBeDisabled();
            });
        });

        context("when 'Import into Existing Table' is selected", function() {
            beforeEach(function() {
                this.dialog.$(".new_table input:radio").prop("checked", false);
                this.dialog.$(".existing_table input:radio").prop("checked", true).change();
            });

            it("should disable the submit button by default", function() {
                expect(this.dialog.$("button.submit")).toBeDisabled();
            });

            it("should enable the truncate option", function() {
                expect(this.dialog.$(".truncate")).toBeEnabled();
            });

            it("should enable the 'select destination table' link", function() {
                expect(this.dialog.$(".existing_table a.dataset_picked")).not.toHaveClass("hidden");
                expect(this.dialog.$(".existing_table span.dataset_picked")).toHaveClass("hidden");
            });

            it("should have a link to the dataset picker dialog", function() {
                expect(this.dialog.$(".existing_table a.dataset_picked")).toContainTranslation("dataset.import.select_dataset");
            });

            context("after clicking the dataset picker link", function() {
                beforeEach(function() {
                    stubModals();
                    spyOn(chorus.Modal.prototype, 'launchSubModal').andCallThrough();
                    spyOn(this.dialog, "datasetsChosen").andCallThrough();
                    this.dialog.$(".existing_table a.dataset_picked").click();
                });

                it("should launch the dataset picker dialog", function() {
                    expect(chorus.Modal.prototype.launchSubModal).toHaveBeenCalled();
                });

                context("after selecting a dataset", function() {
                    beforeEach(function() {
                        var datasets = [rspecFixtures.workspaceDataset.datasetTable({ objectName: "myDatasetWithAReallyReallyLongName" })];
                        chorus.modal.trigger("datasets:selected", datasets);
                    });

                    it("should show the selected dataset in the link, ellipsized", function() {
                        expect(this.dialog.datasetsChosen).toHaveBeenCalled();
                        expect(this.dialog.$(".existing_table a.dataset_picked")).toContainText("myDatasetWithAReally...");
                    });

                    it("stores the un-ellipsized dataset name on the dialog", function() {
                        expect(this.dialog.selectedDatasetName).toBe("myDatasetWithAReallyReallyLongName");
                    });

                    it("should re-enable the submit button", function() {
                        expect(this.dialog.$("button.submit")).toBeEnabled();
                    });

                    describe("clicking the 'import' button", function() {
                        beforeEach(function() {
                            this.dialog.$("button.submit").click();
                        });

                        it("sends the correct dataset name", function() {
                            expect(this.server.lastCreate().params()["dataset_import[to_table]"]).toBe("myDatasetWithAReallyReallyLongName");
                        });
                    });

                    context("and then 'import into new table is checked", function() {
                        beforeEach(function() {
                            this.dialog.$(".existing_table input:radio").prop("checked", false);
                            this.dialog.$(".new_table input:radio").prop("checked", true).change();
                        });

                        it("still shows the selected table name in the existing table section", function() {
                            expect(this.dialog.$(".existing_table span.dataset_picked")).not.toHaveClass('hidden');
                        });
                    });
                });
            });

            context("and the form is submitted", function() {
                beforeEach(function() {
                    this.dialog.$(".truncate").prop("checked", true).change();
                    this.dialog.$(".existing_table a.dataset_picked").text("a");
                    this.dialog.onInputFieldChanged();

                    this.dialog.$("button.submit").click();
                });

                it("should save the model", function() {
                    expect(this.server.lastCreateFor(this.dialog.model)).toBeDefined();
                    expect(this.server.lastCreateFor(this.dialog.model).params()["dataset_import[truncate]"]).toBe("true");
                    expect(this.server.lastCreateFor(this.dialog.model).params()["dataset_import[new_table]"]).toBe("false");
                });
            });
        });

        context("when 'Import into new table is selected", function() {
            beforeEach(function() {
                this.dialog.$(".new_table input:radio").prop("checked", true).change();
                this.dialog.$(".existing_table input:radio").prop("checked", false).change();
            });

            itBehavesLike.importIntoNewTableIsSelected();

            context("when a new table name is specified", function() {
                beforeEach(function() {
                    this.dialog.$(".new_table input.name").val("good_table_name").trigger("keyup");
                });

                it("enables the submit button", function() {
                    expect(this.dialog.$("button.submit")).toBeEnabled();
                });

                context("when the 'limit rows' checkbox is checked", function() {
                    beforeEach(function() {
                        this.dialog.$(".limit input:checkbox").prop("checked", true).change();
                    });

                    it("should enable the limit text-input", function() {
                        expect(this.dialog.$(".limit input:text")).toBeEnabled();
                    });

                    context("when a valid row limit is entered", function() {
                        beforeEach(function() {
                            this.dialog.$(".limit input:text").val("345").trigger("keyup");
                        });

                        it("enables the submit button", function() {
                            expect(this.dialog.$("button.submit")).toBeEnabled();
                        });
                    });
                });

                context("when the form is submitted", function() {
                    beforeEach(function() {
                        this.dialog.$("button.submit").click();
                    });

                    it("saves the model", function() {
                        expect(this.server.lastCreateFor(this.dialog.model)).toBeDefined();
                        expect(this.server.lastCreateFor(this.dialog.model).params()["dataset_import[truncate]"]).toBe("false");
                        expect(this.server.lastCreateFor(this.dialog.model).params()["dataset_import[new_table]"]).toBe("true");
                        expect(this.server.lastCreateFor(this.dialog.model).params()["dataset_import[to_table]"]).toBe("good_table_name");
                    });

                    it("should put the submit button in the loading state", function() {
                        expect(this.dialog.$("button.submit").isLoading()).toBeTruthy();
                        expect(this.dialog.$("button.submit")).toContainTranslation("import.importing");
                    });

                    context("and the save is successful", function() {
                        beforeEach(function() {
                            spyOn(chorus, "toast");
                            spyOn(this.dialog, "closeModal");
                            this.server.completeSaveFor(this.dialog.model);
                        });

                        it("should display a toast", function() {
                            expect(chorus.toast).toHaveBeenCalledWith("import.success");
                        });

                        it("should close the dialog", function() {
                            expect(this.dialog.closeModal).toHaveBeenCalled();
                        });

                    });

                    context("and the save is not successful", function() {
                        beforeEach(function() {
                            this.server.lastCreate().failUnprocessableEntity();
                        });

                        it("should not display the loading spinner", function() {
                            expect(this.dialog.$("button.submit").isLoading()).toBeFalsy();
                        });
                    });
                });
            });
        });
    });

    context("without a workspace", function() {
        beforeEach(function() {
            this.dataset = rspecFixtures.oracleDataset();
            this.dialog = new chorus.dialogs.ImportNow({
                dataset: this.dataset
            });
            this.dialog.render();
        });

        context("clicking the schema link", function() {
            beforeEach(function() {
                this.modalSpy = stubModals();
                this.dialog.$("a.select_schema").click();
            });

            it("displays a schema picker dialog", function() {
                expect(this.modalSpy.lastModal()).toBeA(chorus.dialogs.SchemaPicker);
            });

            it("sets the schema when one chosen", function() {
                this.schema = rspecFixtures.schema();
                this.modalSpy.lastModal().trigger("schema:selected", this.schema);
                expect(this.dialog.schema).toBe(this.schema);
                expect(this.dialog.$(".destination")).toContainText(this.schema.canonicalName());
            });

            context("when the form is submitted", function() {
                beforeEach(function() {
                    this.dialog.$(".new_table input.name").val("good_table_name").trigger("keyup");
                    this.schema = rspecFixtures.schema();
                    this.modalSpy.lastModal().trigger("schema:selected", this.schema);
                    this.dialog.$("button.submit").click();
                });

                it("saves the model", function() {
                    expect(this.server.lastCreateFor(this.dialog.model)).toBeDefined();
                    expect(this.server.lastCreateFor(this.dialog.model).params()["dataset_import[schema_id]"]).toBe(this.schema.id);
                });
            });
        });
    });
});
