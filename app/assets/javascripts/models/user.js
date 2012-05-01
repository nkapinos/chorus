chorus.models.User = chorus.models.Base.extend({
    constructorName: "User",

    urlTemplate: "users/{{id}}",
    showUrlTemplate: "users/{{id}}",
    entityType: "user",
    nameFunction: 'displayName',

    workspaces:function () {
        if (!this._workspaces) {
            this._workspaces = new chorus.collections.WorkspaceSet([], { userId: this.get("id") });
            this._workspaces.bind("reset", function () {
                this.trigger("change");
            }, this);
        }
        return this._workspaces;
    },

    activeWorkspaces: function() {
        if(!this._activeWorkspaces) {
            this._activeWorkspaces = new chorus.collections.WorkspaceSet([], {userId: this.get("id"), active: true})
        }

        return this._activeWorkspaces;
    },

    declareValidations:function (newAttrs) {
        this.require('first_name', newAttrs);
        this.require('last_name', newAttrs);
        this.require('username', newAttrs);
        this.requireValidEmailAddress('email', newAttrs);

        if(!this.ldap){
            this.requireConfirmationForChange('password', newAttrs);
        }
    },

    requireValidEmailAddress:function (name, newAttrs) {
        this.requirePattern(name, /[\w\.-]+(\+[\w-]*)?@([\w-]+\.)+[\w-]+/, newAttrs);
    },

    requireConfirmationForChange:function (name, newAttrs) {
        if (this.isNew() || (newAttrs && newAttrs.hasOwnProperty(name))) {
            this.require(name, newAttrs);
            this.requireConfirmation(name, newAttrs);
        }
    },

    hasImage:function () {
        return true;
    },

    imageUrl:function (options) {
        options = (options || {});
        var url = new URI("/userimage/" + this.get("id") + "?size=" + (options.size || "original"));
        url.addSearch({iebuster: chorus.cachebuster()});
        return url.toString();
    },

    currentUserCanEdit: function() {
        var currentUser = chorus.session.user();
        return currentUser.isAdmin() || this.get("username") === currentUser.get("username");
    },

    isAdmin: function() {
        return !!this.get("admin");
    },

    picklistImageUrl:function () {
        return this.imageUrl();
    },

    displayName:function () {
        if (!this.get('first_name') && !this.get('last_name') && this.get('fullName')) {
            return this.get('fullName');
        }
        return [this.get("first_name"), this.get("last_name")].join(' ');
    },

    displayShortName:function (length) {
        length = length || 20;

        var name = this.displayName();
        return (name.length < length) ? name : this.get("first_name") + " " + this.get("last_name")[0] + ".";
    },

    attrToLabel:{
        "email":"users.email",
        "first_name":"users.first_name",
        "last_name":"users.last_name",
        "username":"users.username",
        "password":"users.password",
        "title":"users.title",
        "department":"users.department",
        "admin":"users.administrator"
    }
});
