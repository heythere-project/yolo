module.exports = {
	http : {
		port : 8081,
		respondWith : 'html',
		statics : 'app/public/',
		notAuthorizedRedirect : '/user/login',
		session : {
			secret : 'zupfkuchen'
		},
		logger : 'HTTP :remote-addr :method :url :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
	},

	database : {
		name : 'heythere',
		/*auth : {
			username : 'admin',
			password : 'zupfkuchen'
		}*/
	},


	//use this only in development!
	liveReload : 'app/**/*.js',

	logger : {
		levels : {
			console : 0,
			file : 3
		}
	},

	model : {
		attachments : {
			host : "http://localhost:5984/heythere/",
			includeExtension : false,
		}
	}
};