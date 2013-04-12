var Backbone = require('backbone'),
	validation = require('backbone-validation'),
	mime = require('mime'),
	util = require('util'),
	_ = require('underscore'),
	Params = require('./params');


/*
	Yolo.Model
	is the Base Model all other Models should inherit from

*/

/* we use the Backbone Model as base */
var BaseModel = function(attributes, options){
	var defaults;
    var attrs = attributes || {};

    if(attrs instanceof Params){
    	throw new Error("Dont Mass assign values to a model <" + this.model_name + ">");
    }

    //new Model definition
    if( Object.keys(this.attributes).length > 0 ){
    	
    	this.defaults = {};
    	this.validation = {};

    	//loop over attributes	
    	for(var attr in this.attributes){
    		if(this.attributes.hasOwnProperty(attr)){
    			continue;
    		}

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

		/*
			validation with attachments is extremly slow even if they dont
			have validation rules. We remove the attachments for validation
			and add them again after the validation to overcome this bootleneck.
		*/
		var attachments = this.attributes._attachments;
		delete this.attributes._attachments;

		var errors = this.validate();

		this.attributes._attachments = attachments;

		if(errors){
			this.validationError = errors;
		}

		this.trigger("validate:after", this.validationError);

		return !errors;
	},

	attach : function(name, content_type, file){
		var _attachments = {};

		if(_.isObject(name)){
			return _.each(files, _.bind(function(name, file){
				this.attach(name, file)
			}, this));
		}

		if(this.get("_attachments")){
			_attachments = _.clone(this.get('_attachments'));
		}

		_attachments[name] = {
			data : file,
			content_type : content_type
		};

		this.set('_attachments', _attachments);
	},

	attachments : function(name){
		var attachments = this.get('_attachments');

		if(attachments && name in attachments){
			var url = Yolo.config.model.attachments.host + this.id + '/' + name;

			//if enabled we determine the file extension form the content type
			if( Yolo.config.model.attachments.includeExtension ){
				url += '.' + mime.extension(attachments[name].content_type);
			}

			return {
				url : url ,
				content_type : attachments[name].content_type
			}
		} 
		
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
      	var attrs, success, method, attachments = this.attributes._attachments, attributes = this.attributes, start = new Date();


      	/*
			validation with attachments is extremly slow even if they dont
			have validation rules. We remove the attachments for validation
			and add them again after the validation to overcome this bootleneck.
		*/
      	delete attributes._attachments;
      	options = _.extend({validate: true, parse: true }, options);

      	this.trigger("validate:before");

      	// Do not persist invalid models.
      	if (!this._validate(attributes, options)) return false;

      	this.trigger("validate:after", this.validationError);


      	//sanitze all strings
      	_.each(this.defaults, function(value, key){
      		if(this.validation[key] && ( ! ("sanitize" in this.model_attributes[key]) || this.model_attributes[key].sanitize === true) ){
      			this.attributes[key] = _.escape(this.attributes[key]);
      		}
      	}, this);

      	//append the models again
      	this.attributes._attachments = attachments;

    	success = options.success;
		options.success = function(model, resp, options) {
			if (_.isObject(resp) && !model.set(resp, options)) {
		  		return false;
			}
			if (success) success(model, resp, options);
			Yolo.logger.info('Model.save took ' + (new Date() - start) + 'ms')
		};

      // Finish configuring and sending the Ajax request.
    	method = this.isNew() ? 'create' : 'update';

     	this.sync(method, this, options);
    },


	/*
		BaseModel.sync
		The basic sync method stores the model with all the attributes
		and the model_name. override this method if you need extended
		functionality.
	*/
	sync : function(method, model, options){
		model.trigger("save:before");

    	var hash = model.toJSON(options),
    		attachments = model.attributes._attachments,
    		log = "";

    	if(attachments){
    		for(var fileName in attachments){
    			/*	if the file has a body attribute it is a new one
    				we convert the body buffer to a base64 string
    				for storing in db 
    			*/
    			if(attachments[fileName].data && attachments[fileName].data instanceof Buffer){
    				log += "\n with " + fileName;
    				attachments[fileName].data = attachments[fileName].data.toString("base64");
    			}
    		}
       	}

       	//set the attachments to the hash
       	hash["_attachments"] = attachments;

    	// set the _type to model_name so we know to which model typ the data belongs
    	hash["type"] = model.model_name;    
   
	    var success = options.success;
	    options.success = function(resp) { 
	      if (success) success(model, resp, options);
	      model.trigger('sync', model, resp, options);
	      model.trigger("save:after", model, resp);
	    };

	    var error = options.error;
	    options.error = function(err) {
	      if (error) error(model, err, options);
	      model.trigger('error', model, err, options);
   	      model.trigger("save:after", model, resp);
	    };

	    if(method === "create"){
	    	log = "Creating <" + hash.type + ' # >' + log; 
	    	Yolo.db.save(hash, function(err, result){
	    		if(err) return options.error(err);
	    		options.success(result);
	    	});
	    } else if (method === "update"){
	    	log = "Updating <" + hash.type + ' #' + hash._id + '>' + log; 

	    	Yolo.db.merge(model.id, model.get('rev'), hash, function(err, result){
				if(err) return options.error(err);
	    		options.success(result);
	    	})
	    } else if (method === "delete"){
	    	log = "Removing <" + hash.type + ' #' + hash._id + '>' + log; 

	    	Yolo.db.remove(model.id, model.get('rev'), hash, function(err, res){
	    		if(err) return options.error(err);
	    		options.success(result);
	    	})
	    }

	    Yolo.logger.info(log);
	},

	set : function(key, value){
		if( _.isObject(key) && key instanceof Params){
			throw new Error("Dont Mass assign values to a model <" + this.model_name + ">");
		}

		return Backbone.Model.prototype.set.call(this, key, value);
	}
});


module.exports = BaseModel;