var mime = require('mime'),
	_ = require('underscore'),
	Params = require('./../../params'),
	Collection = require('backbone').Collection,
	formatName = function(str){
		return str.charAt(0).toUpperCase() + str.slice(1).replace('.js', '');
	};

exports.Model = Yolo.baseModel.extend({
	_adapter : 'Couchdb',

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
		} else {
			return {
				url : undefined,
				content_type : undefined
			}
		}
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
	    	log = "Creating <" + hash.type + '>' + log; 
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
});

exports.staticInit = function( Model, model_instance, model_proto ){
	var views = {
		findById : {
			map : "function(doc){ if(doc.type === '"+model_proto.model_name+"'){ emit(doc._id, doc);}}"
		}
	};

	//generate views foreach attribute
	_.each(model_instance.defaults, function(v, attribute){
		views["findBy" + formatName(attribute) ] = {
			map : 'function(doc){ if(doc.type === "'+model_proto.model_name+'"){ emit(doc.'+attribute+', doc);}}'
		};
	});

	//collect view methods
	views = _.extend({}, model_instance.views, views);

	//save view methods to db
	Yolo.db.save('_design/' + model_proto.model_name, views);

	//replace the methods with functions for calling the db
	_.each(views, function(methods, viewName){
		//assign each view as static method to the model
		Model[viewName] = function(options, cb, ctx){
			//if theres no callback we do nothing
			if (!cb || !cb.call){
				return;
			}

			if(_.isString(options)){
				options = {key: options};
			}

			//call the view
			Yolo.db.view(model_proto.model_name + '/' + viewName, options || {}, function(err, result){
				var res =  new Collection();
				
				if(err){
					//handle error
					//TODO what should we do with database errors?
					console.log(err);
					return cb.call(ctx || this, res);
				}
				//we loop over each item in db result and create a class instance with the result values
				for(var i = 0, len = result.length, item = result[i], Model; i < len; i++, item = result[i]){
					
					//lockup the model							
					if( (Model = Yolo.models[formatName(item.value.type)]) ){
						//type is only for db storing and referncing back to the model
						delete item.value.type;
						//push the created model to the result
						res.add( new Model(item.value) );
					}

				}
				
				cb.call(ctx || this, res );
			});
		};
	});

	//delete the the views object
	delete Model.prototype.views;

	return Model;
};