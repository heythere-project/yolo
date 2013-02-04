var _ = require('underscore');

/*
	Yolo.Controller
	is the Base Controller all other Controllers should inherit from
*/

function BaseController(){

}

/* … and override and extend the methods with ours */
_.extend( BaseController.prototype, {
	renderHTML : function(template, params){
		var format = this.request.params.format;
		if( format && format === 'html' || Yolo.config.http.respondWith === 'html' ){
			this.response.end( params );
		}
	},

	renderJSON : function(params){
		var format = this.request.params.format;
		if( format && format === 'json' || Yolo.config.http.respondWith === 'json' ){
			this.response.json( params );
		}
	}
});


module.exports = BaseController;