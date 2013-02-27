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
		var self = this,
			last_rev = this.currentUser.get("_rev");

		if(params.files.cover.size > 0){
			return;

			var covers = new ImageProcessor({
				image : params.files.cover.path,
				styles : {
					profile : {
						geometry : { width : 600, height: 1000 },
						format : 'jpg'
					},

					/*original : {
						format : 'jpg'
					}*/
				}
			});

			covers.on('style', function(style, imgBuffer){
				Yolo.db.saveAttachment({ 
			  		id : self.currentUser.id,
			  		rev : last_rev
			  	},{
	                name: 'cover_' + style + '.jpg', 
	                contentType: params.files.cover.type, 
	                body: imgBuffer
               }, function(err, result){
               		if(err) return console.warn(err);
               		last_rev = result.rev;
               });
			});

			covers.on('done', function(){
				console.log("cover done");
			});
		}

		if(params.files.profile.size > 0){
			var profiles = {}, 
				processor = new ImageProcessor({
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
				profiles[style] = {
					name: 'profile_' + style + '.jpg', 
	                contentType: params.files.cover.type, 
	                data: imgBuffer
				};
			});

			processor.on('done', function(){
				Yolo.db.merge(self.currentUser.id, {
					_rev : self.currentUser.get('_rev'),
					_attachments : profiles
				}, function(){
					console.log(arguments);
				});
			});
		}

		this.renderHTML('users/profile', {user : this.currentUser });
	},
});

//export Users controller
module.exports = Users;