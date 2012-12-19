describe("chorus.views.TagBox", function() {
    var view, model;

    beforeEach(function() {
        view = new chorus.views.TagBox();
        model = rspecFixtures.workfile.sql({
            tags: []
        });
        view.model = model;
    });

    describe("#render", function() {
        beforeEach(function() {
            view.render();
        });

        context("when there are no tags", function() {
            it('shows the add tags link, textarea is hidden', function() {
                expect(view.$('a')).toContainTranslation('tags.add_tags');
                expect(view.$(".save_tags")).not.toExist();
            });
        });

        context("when there are already tags", function() {
            beforeEach(function() {
                model = rspecFixtures.workfile.sql({
                    tags: [{name: "alpha"}]
                });
                view.model = model;
                view.render();
            });

            it("should show the tags", function() {
                expect(view.$(".tag-list span")).toContainText("alpha");
                expect(view.$("textarea")).not.toExist();
            });

            it("should show tags without the x's", function() {
                expect(view.$(".text-remove")).not.toExist();
            });

            it("only shows the edit tags link", function() {
                expect(view.$(".save_tags")).not.toExist();
                expect(view.$(".edit_tags")).toExist();
                expect(view.$('a')).toContainTranslation('tags.edit_tags');
            });
        });
    });

    describe("when there are no tags", function() {
        beforeEach(function() {
            view.render();
        });
        context("clicking on add tags", function() {
            it('shows the textarea', function() {
                expect(view.$('.save_tags')).not.toExist();
                expect(view.$('.edit_tags')).toExist();
                view.$('a.edit_tags').click();
                expect(view.$('.save_tags')).toExist();
                expect(view.$('.edit_tags')).not.toExist();
                expect(view.$("textarea")).toExist();
            });
        });
    });

    describe("When there are some existing tags", function() {

        beforeEach(function() {
            view.model.tags().reset([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
            view.render();
        });

        it('shows the tag names', function() {
            expect(view.$el).toContainText("alpha");
            expect(view.$el).toContainText("beta");
            expect(view.$el).toContainText("gamma");
        });

        describe("When edit is clicked", function() {
            var textarea;

            beforeEach(function() {
                view.$('a.edit_tags').click();
                textarea = view.$('textarea');
            });

            function enterTag(tagName) {
                var keyup = $.Event('keyup');
                keyup.keyCode = $.ui.keyCode.ENTER;
                var enter = $.Event('enterKeyPress');
                enter.keyCode = $.ui.keyCode.ENTER;
                textarea.val(tagName);
                textarea.focus();
                textarea.trigger(enter);
                textarea.trigger(keyup);
            }

            it('shows the x character on the tags', function() {
                expect(view.$(".text-remove").eq(0)).toExist();
            });

            describe("when a valid tag is entered", function() {
                beforeEach(function() {
                    var tagName = _.repeat("a", 100);
                    enterTag(tagName);
                });

                it("creates a new tag", function() {
                    expect(view.$(".text-tag").length).toBe(4);
                });

                it("removes the text from the textarea", function() {
                    expect(textarea.val()).toBe("");
                });
            });

            describe("when an invalid tag is entered", function() {
                var longString;
                beforeEach(function() {
                    longString = _.repeat("a", 101);
                    enterTag(longString);
                });

                it("does not create a new tag", function() {
                    expect(view.$(".text-tag").length).toBe(3);
                    expect(view.model.tags().length).toBe(3);
                });

                it("does not remove the text from the textarea", function() {
                    expect(textarea.val()).toBe(longString);
                });

                it("shows an error message", function() {
                    expect(textarea).toHaveClass("has_error");
                    expect(textarea.hasQtip()).toBeTruthy();
                });

                it("entering a valid tag clears the error class", function() {
                    enterTag("new-tag");
                    expect(textarea).not.toHaveClass("has_error");
                });
            });

            describe("when a duplicate tag is entered", function() {
                beforeEach(function() {
                    enterTag("alpha");
                });

                it("does not create the duplicate tag", function() {
                    expect(view.$(".text-tag").length).toBe(3);
                    expect(view.model.tags().length).toBe(3);
                });
            });

            describe("click done", function() {
                beforeEach(function() {
                    spyOn(model.tags(), "save");
                    var tags = '[{"name": "alpha"}, {"name": "beta"}, {"name": "delta"}]';
                    view.$('input[type=hidden]').val(tags);
                    view.$('a.save_tags').click();
                });

                it("closes the text box", function() {
                    expect(view.$('.save_tags')).not.toExist();
                    expect(view.$('.edit_tags')).toExist();
                    expect(view.$("textarea")).not.toExist();
                });

                it("sets the updated tags on the currect backbone model", function() {
                    expect(view.model.tags().map(function(tag){return tag.name()})).
                        toEqual(["alpha", "beta", "delta"]);
                });

                it('saves the tags', function() {
                    expect(model.tags().save).toHaveBeenCalled();
                });

                it('hides the x character on the tag', function() {
                    expect(view.$(".text-remove")).not.toExist();
                });

                xit("displays the new tags", function() {
                    expect(view.$('a')).toContainTranslation('tags.edit_tags');
                });
            });

            describe("removing all the tags and clicking done", function() {
                beforeEach(function() {
                    view.$(".text-remove").click();
                    view.$('a.save_tags').click();
                });

                it("updates the 'edit_tags' text", function() {
                    expect(view.$(".edit_tags")).toContainTranslation("tags.add_tags");
                });
            });

            describe("typing a tag without hitting enter and then clicking done", function() {
                context("when the last tag is valid", function() {
                    beforeEach(function() {
                        view.$("textarea").val("hello");
                        view.$(".save_tags").click();
                    });

                    it("includes that last tag", function() {
                        expect(view.$el).toContainText("hello");
                        expect(view.model.tags().containsTag("hello")).toBe(true);
                    });

                    it("posts", function() {
                        expect(this.server.lastCreate()).toBeDefined();
                    });

                    it("does not update the model", function() {
                        expect(model.tags().length).toBe(4);
                    });
                });

                context("when the last tag is invalid", function() {
                    beforeEach(function() {
                        this.server.reset();
                        view.$("textarea").val("alpha");
                        view.$(".save_tags").click();
                    });

                    it("should not do post", function() {
                        expect(this.server.lastCreate()).toBeUndefined();
                    });

                    it("does not update the model", function() {
                       expect(model.tags().length).toBe(3);
                    });

                    it("doesn't reset the last tag on the next keyup", function() {
                        view.$("textarea").val("alpha2");
                        var keyup = $.Event("keyup");
                        view.$("textarea").trigger(keyup);
                        expect(view.$('textarea').val()).toBe("alpha2");
                    });
                });
            });
        });
    });
});
