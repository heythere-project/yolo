module.exports = {
	http : {
		port : 8081,
		respondWith : 'html',
		statics : 'app/public/',
		notAuthorizedRedirect : '/user/login',
		session : {
			secret : 'zupfkuchen'
		},
	},

	database : {
		name : 'heythere',
		/*auth : {
			username : 'admin',
			password : 'zupfkuchen'
		}*/
	},

	logger : {
		levels : {
			console : 5,
			file : 2
		}
	},

	model : {
		attachments : {
			host : "http://localhost:5984/heythere/",
			includeExtension : false,
		}
	}
};