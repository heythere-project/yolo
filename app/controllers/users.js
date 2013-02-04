var Users = function(){};

Users.prototype.getToken = function(params){
	
	this.renderHTML({
		message : "You will never get a Token Bitch!"
	});

	this.renderJSON({
		message : "You will never get a Token Bitch!"
	});
};

Users.prototype.destroyToken = function(){

};

module.exports = Users;