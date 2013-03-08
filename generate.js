var usage = [
		'\033[4m' + "Yolo Generator!" + '\033[24m',
		"Generate Model 'Post' with attributes: id and author and content:",
		'\033[34m' + "$0 model post id author content" + '\033[39m',
		"",
		"Generate Controller 'Posts' with methods: index, edit and delete:",
		'\033[34m' + "$0 controller posts index edit delete" + '\033[39m',
		"",
		"More help at https://github.com/wemakeweb/heythere_appserver",
		
	].join('\n'),
	fs = require('fs'),
	model_template,
	controller_template,
	toUpperCase = function(str){
		return str.charAt(0).toUpperCase() + str.slice(1);
	},
	tab1 = "	",
	tab2 = "		",
	args = require('optimist')
			.usage(usage)
			.demand('_')
			.default('path', process.env.PWD + '/app/').describe("path", "The path to the appfolder")
			.default('clean', false).describe('clean', "If true template will contain no comments")
			.argv;

	/* Templates */
	model_template = [
		"var $0 = Yolo.Model.extend({",							
		"	model_name : '$1',", 														
		"",																	
		"	defaults : {", 															
		"$2",																	
		"	},", 
		"",
		"	/*",
		"		You can use various validations for attributes.",
		"		See the list of them at: https://github.com/wemakeweb/heythere_appserver#validation",
		"	*/",
		"	validation : { ",
		"$3",
		"	},",
		"",
		"	/*",
		"		We autogenerate views for each default attribute directly, so you dont ",
		"		have to write them. Feel free to add custom views here. They will be synced",
		"		with the db before start. You can call this $0.myCustomView(key, function(result){})",
		"		https://github.com/wemakeweb/heythere_appserver#views",
		"	*/",
		"	/* ",
		"	views : {",
		"		myCustomView : {",
		"			map: function(doc){",
		"					emit(doc.id, doc);",
		"			},",
		"			reduce : function(){",
		"					//…",
		"			}",
		"		}",
		"	},",
		"	*/",
		"",
		"	/*",
		"		This Method is called when the Model gets initialized.",
		"		You can then for example bin 'after' and 'before' Functions to Events.",
		"		We emit Events on this.before('validate', function(){}) this.after('validate', function(){})",
		"		this.before('save', function(){}) this.after('save', function(){}).",
		"	*/",
		"	/*",
		"	initialize : function(){", 
		"		// this.before('save', function(){ })",
		"	},",
		"	*/",

		"};",
		"",
		"module.exports = $0;"
	].join('\n');

	controller_template = [
		"var $0 = Yolo.Controller.extend({",							
		"	/*",
		"		The following methods and attributes are available in each method:",
		"			this.currentUser",
		"			this.renderHTML(template, options = {})",
		"			this.renderJSON(options = {})",
		"			this.redirect(path)",
		"		more about them at https://github.com/wemakeweb/heythere_appserver#controllers",
		"	*/",
		"",
		"$1",
		"});",
		"",
		"module.exports = $0;"
	].join('\n');

if(args._[0] === "controller"){
	var path = args.path + 'controllers',
		name = args._[1].toLowerCase(),
		methods = args._.slice(2),
		methodsStr = [];

		if(!fs.existsSync(path)){
			console.log("Created Folder " + path);
			fs.mkdirSync(path);
		} 

		if(fs.existsSync(path + '/' + name + '.js')){
			console.error('\033[32m%s\033[39m', 'Controller with Name "' + name + '" allready exists!' );
			process.exit(1);
		}

		methods.forEach(function(method){
			methodsStr.push(tab1 + '/*');
			methodsStr.push(tab2 + '[GET] ' + toUpperCase(name) + '.' + method);
			methodsStr.push(tab1 + '*/');
			methodsStr.push(tab1 + method + ' : function( params ){ ');
			methodsStr.push(tab2);
			methodsStr.push(tab1 + '},');
			methodsStr.push('');
		});

		controller_template = controller_template.replace(/\$0/g, toUpperCase(name));
		controller_template = controller_template.replace(/\$1/g, methodsStr.join('\n'));

		if(args.clean){
			controller_template = controller_template.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)/gm
, '');
		}

		fs.writeFileSync(path + '/' + name + '.js', controller_template);
		console.log('\033[34m%s\033[39m' , "Created Controller '" + toUpperCase(name) + "' at " + path + '/' + name + '.js' + " ✔");

} else if(args._[0] === "model"){
	var path = args.path + 'models',
		name = args._[1].toLowerCase(),
		attributes = args._.slice(2),
		attributeStr = [],
		validatesStr = [];

	if(!fs.existsSync(path)){
		console.log("Created Folder " + path);
		fs.mkdirSync(path);
	} 

	if(fs.existsSync(path + '/' + name + '.js')){
		console.error('\033[32m%s\033[39m', 'Model with Name "' + name + '" allready exists!' );
		process.exit(1);
	}

	attributes.forEach(function(attribute){
		if(attribute.indexOf(':') != -1){
			var parts = attribute.split(':');

			if(parts[1] === "required"){
				validatesStr.push(tab2 + parts[0] + ' : { required : true },');
			}

			attributeStr.push(tab2 + parts[0] + ' : null,' );
		} else {
			attributeStr.push(tab2 + attribute + ': null,');
			validatesStr.push(tab2 + attribute + ' : { required : false },');
		}
	});

	model_template = model_template.replace(/\$0/g, toUpperCase(name));
	model_template = model_template.replace(/\$1/g, name);
	model_template = model_template.replace(/\$2/g, attributeStr.join('\n'));
	model_template = model_template.replace(/\$3/g, validatesStr.join('\n'));

	if(args.clean){
		model_template = model_template.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)/gm
, '');
	}

	fs.writeFileSync(path + '/' + name + '.js', model_template);
	console.log('\033[34m%s\033[39m' , "Created model '" + toUpperCase(name) + "' at " + path + '/' + name + '.js' + " ✔");
}