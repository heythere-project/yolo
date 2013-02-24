var Backbone = require('backbone'),
	validation = require('backbone-validation');


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
    	var hash = model.toJSON(options);

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
	    	Yolo.db.save(hash, function(err, result){
	    		if(err) return options.error(err);
	    		options.success(result);
	    	});
	    } else if (method === "update"){
	    	Yolo.db.save(model.id, model.get('rev'), hash, function(err, result){
				if(err) return options.error(err);
	    		options.success(result);
	    	})
	    } else if (method === "delete"){
	    	Yolo.db.remove(model.id, model.get('rev'), hash, function(err, res){
	    		if(err) return options.error(err);
	    		options.success(result);
	    	})
	    }

	}
});


module.exports = BaseModel;