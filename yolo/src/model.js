var Backbone = require('backbone'),
	validation = require('backbone-validation'),
	mime = require('mime');



/*
	Yolo.Model
	is the Base Model all other Models should inherit from

*/


/* we use the Backbone Model as base */
var BaseModel = Backbone.Model;

/* extend it with Backbone validations https://github.com/thedersen/backbone.validation#using-server-validation */
_.extend( BaseModel.prototype, validation.mixin );

/* extend the methods with ours */
_.extend( BaseModel.prototype, { 

	idAttribute : "_id",

	isValid : function(){
		var errors = this.validate();
		if(errors){
			this.validationError = errors;
		}
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
	
	save: function(options) {
      	var attrs, success, method, attributes = this.attributes;

      	options = _.extend({validate: true, parse: true }, options);

      	// Do not persist invalid models.
      	if (!this._validate(attrs, options)) return false;

    	success = options.success;
		options.success = function(model, resp, options) {
			if (_.isObject(resp) && !model.set(resp, options)) {
		  		return false;
			}
			if (success) success(model, resp, options);
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

    	// set the _type to model_name so we know to which model typ the data belongs
    	hash["type"] = model.model_name;    
   
	    var success = options.success;
	    options.success = function(resp) { 
	      if (success) success(model, resp, options);
	      model.trigger('sync', model, resp, options);
	    };

	    var error = options.error;
	    options.error = function(err) {
	      if (error) error(model, err, options);
	      model.trigger('error', model, err, options);
	    };

	    if(method === "create"){
	    	log = "Saving <" + hash.type + ' #' + hash._id + '>' + log; 
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

	}
});


module.exports = BaseModel;