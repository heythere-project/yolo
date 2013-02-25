module.exports = {
	http : {
		port : 8081,
		respondWith : 'html',
		statics : 'app/public/',
		notAuthorizedRedirect : '/user/login'
	},

	database : {
		name : 'heythere',
		/*auth : {
			username : 'admin',
			password : 'zupfkuchen'
		}*/
	},

	liveReload : 'app/**/*.js',

	session : {
		secret : 'zupfkuchen'
	},


}