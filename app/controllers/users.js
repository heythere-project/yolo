var Users = function(){};

Users.prototype.getToken = function(req, res){
	res.end("You will never get a Token Bitch!")
};

Users.prototype.destroyToken = function(){

};

module.exports = Users;