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
		this.renderHTML('users/profile', {user : this.currentUser });
	},

	edit : function(params){
		var self = this,
			wait = 0;

		if(params.bio){
			this.currentUser.set('bio', params.bio);
		}

		if(params.files.cover.size > 0){
			wait++;

			var coverProcessor = new ImageProcessor({
				image : params.files.cover.path,
				styles : {
					profile : {
						geometry : { width : 600, height: 1000 },
						format : 'jpg'
					},

					original : {
						format : 'jpg'
					}
				}
			});

			coverProcessor.on('style', function(style, imgBuffer){
				self.currentUser.attach('cover_' + style, params.files.cover.type, imgBuffer);
			});

			coverProcessor.on('done', _.bind(done, this));
		}

		if(params.files.profile.size > 0){
			wait++;

			var profileProcessor = new ImageProcessor({
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
						original : {
							format : 'jpg'
						}
					}
				});

			profileProcessor.on('style', function(style, imgBuffer){
				self.currentUser.attach('profile_' + style, params.files.profile.type, imgBuffer);
			});

			profileProcessor.on('done', _.bind(done, this));
		}

		function done(){
			if(--wait === 0){
				render.call(this);
			}
		};

		function render(){
			if(wait !== 0){
				return;
			}

			if(this.currentUser.isValid()){
				this.renderHTML('users/profile', {user : this.currentUser });
				this.currentUser.save();
			} else {
				//maybe we could save the profile picture even if the cover processing failed
				this.renderHTML('users/profile', {
					user : this.currentUser, 
					errors: this.currentUser.validationError 
				});
			}
		}

		render.call(this);

	},
});

//export Users controller
module.exports = Users;