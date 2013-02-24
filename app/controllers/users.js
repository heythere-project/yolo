var bcrypt = require('bcrypt');

var Users = function(){},
	hashSync = function(str){
		return bcrypt.hashSync(str, bcrypt.genSaltSync(10)); 
	},
	User = Yolo.models.User;

Users.prototype.register = function(params){
	var user = new User({
		firstName : params.firstName,
		lastName : params.lastName,
		email : params.email
	});


	if(params.password){
		user.set('password', hashSync(params.password));
	}

	if( !user.isValid() ){
		this.renderHTML( 'users/register', {
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
			this.redirect("/")
		}, this)
	});	
};


Users.prototype.registerForm = function(){
	this.renderHTML("users/register");
};

Users.prototype.loginForm = function(){
	this.renderHTML("users/login");
};

Users.prototype.login = function(params){
	if(!params.password || !params.email){
		this.renderHTML("users/login", {
			error : {
				message : "Provide email and password."
			}
		});
	}

	User.findByEmail(params.email, function(users){
		var user = users[0],
			self = this;

		bcrypt.compare(params.password, user.get('password'), function(err, same) {
			if( same ){
				user.set('lastLogin', new Date() );
				user.save();

				//set session cockie here
				self.request.session.user = user;

				self.redirect("/");
			} else {
				self.renderHTML("users/login", {
					error : {
						message : "Wrong email or password"
					}
				});
			}
		});
	}, this)
};

Users.prototype.logout = function(){
	this.request.session.destroy(_.bind(function(e){ 
		this.redirect('user/login');
	}, this));
};

Users.prototype.profile = function(){
	this.renderHTML('users/profile', {user : this.currentUser });
};

module.exports = Users;