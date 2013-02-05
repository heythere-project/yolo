var bcrypt = require('bcrypt');

var Users = function(){};

Users.prototype.register = function(params){
	var user = new Yolo.models.User({
		firstName : params.firstName,
		lastName : params.lastName,
		email : params.email,
	});

	if(params.password){
		var salt = bcrypt.genSaltSync(10);
		user.set('password', bcrypt.hashSync("B4c0/\/", salt));
	}

	if( !user.isValid() ){
		this.renderHTML({
			message : 'validation error',
			errors : user.validationError
		});
		this.renderJSON({
			message : 'validation error',
			errors : user.validationError
		});

		return;
	} 

	user.save({
		success : _.bind(function(user){
			this.renderHTML({
				message : "saved"
			});
			this.renderJSON({
				message : "saved"
			});
		}, this)
	});

	
};
Users.prototype.getToken = function(){

};
Users.prototype.destroyToken = function(){

};

module.exports = Users;