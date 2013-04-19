var Backbone = require('backbone'),
	validation = require('backbone-validation'),
	mime = require('mime'),
	util = require('util'),
	_ = require('underscore'),
	Params = require('./../params');


/*
	Yolo.Model
	is the Base Model all other Models should inherit from

*/

/* we use the Backbone Model as base */
var BaseModel = function(attributes, options){
	var defaults;
    var attrs = attributes || {};
    var adapter;

    if(attrs instanceof Params){
    	throw new Error("Dont Mass assign values to a model <" + this.model_name + ">");
    }

    //new Model definition
    if( Object.keys(this.attributes).length > 0 ){
    	
    	this.defaults = {};
    	this.validation = {};

    	//loop over attributes	
    	for(var attr in this.attributes){
    		//each attributes gets the specifed default value or null instead
    		this.defaults[attr] = this.attributes[attr].default || null;
    		delete this.attributes[attr].default;

    		_.each(this.attributes[attr], _.bind(function(value, key){
    			if(key in validation.validators ){
    				(this.validation[attr] || (this.validation[attr] = {}))[key] = value;
    			} 
    		}, this ));
    	}

    	this.model_attributes = this.attributes;
    	this.attributes = {};
    }

    this.cid = _.uniqueId('c');
    this.attributes = {};

    if (options && options.collection) this.collection = options.collection;
    if (options && options.parse) attrs = this.parse(attrs, options) || {};

    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
};

BaseModel.prototype = new Backbone.Model();
BaseModel.extend = Backbone.Model.extend;



/* extend it with Backbone validations https://github.com/thedersen/backbone.validation#using-server-validation */
_.extend( BaseModel.prototype, validation.mixin );


/* extend the methods with ours */
_.extend( BaseModel.prototype, { 

	idAttribute : "_id",

	isValid : function(){
		//emit event
		this.trigger("validate:before");

		var errors = this.validate();

		if(errors){
			this.validationError = errors;
		}

		this.trigger("validate:after", this.validationError);

		return !errors;
	},

	//shortcut to after event
	after : function(what, fn, ctx){
		if(ctx){
			fn = _.bind(fn, ctx);
		}

		this.on( what + ':after', fn );
	},

	//shortcut to before event
	before : function(what, fn, ctx){
		if(ctx){
			fn = _.bind(fn, ctx);
		}

		this.on( what + ':before', fn );
	},
	
	save: function(options) {
      	throw new Error("Save has to be implemented by model adapter");
    },

	sync : function(method, model, options){
		throw new Error("Sync has to be implemented by model adapter");
	},

	set : function(key, value){
		if( _.isObject(key) && key instanceof Params){
			throw new Error("Dont Mass assign values to a model <" + this.model_name + ">");
		}

		return Backbone.Model.prototype.set.call(this, key, value);
	}
});


module.exports = BaseModel;