var _ = require('underscore'),
	Backbone = require('backbone');


/*
	Yolo.Model
	is the Base Model all other Models should inherit from

*/

/* we use the Backbone Model as base */
var BaseModel = Backbone.Model;

/* … and override and extend the methods with ours */
_.extend( BaseModel.prototype, {

	/* we change the id Attribute to match with the couchdb _id */
	idAttribute : "_id"

});


module.exports = BaseModel;