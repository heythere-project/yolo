var bcrypt = require('bcrypt'),
	hashSync = function(str){ return bcrypt.hashSync(str, bcrypt.genSaltSync(10)) },
	ImageProcessor = require('./../modules/imageProcessor'),
	User = Yolo.models.User;

var Users = Yolo.Controller.extend({
	register : function(params){
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
				this.request.session.user = user;
				this.redirect("/")
			}, this)
		});	
	},

	registerForm : function(){
		this.renderHTML("users/register");
	},

	loginForm : function(){
		this.renderHTML("users/login");
	},

	login : function(params){
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

			if(!user){
				return self.renderHTML("users/login", {
					error : {
						message : "Wrong email or password"
					}
				});
			}

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
	},

	logout : function(){
		this.request.session.destroy(_.bind(function(e){ 
			this.redirect('user/login');
		}, this));
	},

	profile : function(){
		console.log(this.currentUser.attributes)
		this.renderHTML('users/profile', {user : this.currentUser });
	},

	edit : function(params){
		var self = this;

	/*	if(params.files.cover.size > 0){
			return;

			var covers = new ImageProcessor({
				image : params.files.cover.path,
				styles : {
					profile : {
						geometry : { width : 600, height: 1000 },
						format : 'jpg'
					},

				//	/*original : {
				//		format : 'jpg'
				//	}
				}
			});
		}*/

		if(params.files.profile.size > 0){
			var processor = new ImageProcessor({
					image : params.files.profile.path,
					styles : {
						small : {
							geometry : { width : 50, height: 50},
							format : 'jpg'
						},
						medium : {
							geometry : { width : 100, height: 100},
							format : 'jpg'
						},
						large : {
							geometry : { width : 250, height: 250},
							format : 'jpg'
						},
						/*original : {
							format : 'jpg'
						}*/
					}
				});

			processor.on('style', function(style, imgBuffer){
				self.currentUser.attach('profile_' + style, params.files.profile.type, imgBuffer);
			});

			processor.on('done', function(){
				self.currentUser.save();
			});
		}

		this.renderHTML('users/profile', {user : this.currentUser });
	},
});

//export Users controller
module.exports = Users;