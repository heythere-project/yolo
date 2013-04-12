var _ = require('underscore');

/*
    Yolo.Controller
    is the Base Controller all other Controllers should inherit from
*/

function BaseController(){}

/* … and override and extend the methods with ours */
_.extend( BaseController.prototype, {
    renderHTML : function(template, params){
        var format = this.request.params.format;
        if( format && format === 'html' || (Yolo.config.http.respondWith === 'html' && !this.response.responded) ){
            this.response.responded = true;
            this.response.render(template, params );
        }
    },

    renderJSON : function(params){
        var format = this.request.params.format;
        if( format && format === 'json' || (Yolo.config.http.respondWith === 'json' && !this.response.responded)){
            this.response.responded = true;
            this.response.json( params );
        }
    },

    redirect : function(to){
        this.response.redirect(to);
    },


    error : function( code, message ){
        this.response.send(code, message || {
            code : code
        });
    },

    authorize : function( data ){
        this.request.session.data = data;
        this.request.session.authorized = true;
    },

    deAuthorize : function( cb ){
        this.request.session.destroy(
            _.bind(cb, this)
        );
    }
});


//stolen form Backbone source
// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
BaseController.extend = function(protoProps, staticProps){
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
};

module.exports = BaseController;