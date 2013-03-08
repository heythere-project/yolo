var User = Yolo.Model.extend({
	model_name : 'user',

	defaults : {
		firstName : null,
		lastName : null,
		email : null,
		password : null,
		bio : null,
		lastLogin : new Date(),
		friends : []
	},

	validation : {
		firstName : { required : true },
		lastName : { required : true },
		bio : { required: false, maxLength : 180 },
		email : { pattern: 'email' },
		password : { required: true, minLength : 5, sanitize: false }
	},

	views : {},

	initialize : function(){
		
		/*
			this.after("validate", function(){
				console.log("after validated")
			})
			this.before("validate", function(){
				console.log("before validated")
			})

			this.after("save", function(){
				console.log("after save")
			})
			this.before("save", function(){
				console.log("before save")
			})

		*/

	},
});


module.exports = User;