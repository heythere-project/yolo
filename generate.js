var usage = [
		'\033[4m' + "Yolo Generator!" + '\033[24m',
		"Generate Model 'Post' with attributes: id and author and content:",
		'\033[34m' + "$0 model post id:required author content" + '\033[39m',
		"",
		"Generate Controller 'Posts' with methods: index, edit and delete:",
		'\033[34m' + "$0 controller posts index edit:post delete:delete" + '\033[39m',
		"",
		"More help at https://github.com/wemakeweb/heythere_appserver",
		
	].join('\n'),
	fs = require('fs'),
	model_template,
	controller_template,
	format = function(str){
		return str.charAt(0).toUpperCase() + str.slice(1);
	},
	tab1 = "	",
	tab2 = "		",
	args = require('optimist')
			.usage(usage)
			.demand('_')
			.default('path', process.env.PWD + '/app/').describe("path", "The path to the appfolder")
			.default('clean', false).describe('clean', "Generate without Comments in the file")
			.default('route', true).describe('route', "Add routes to the routing file when generating a controller")
			.argv,
	rootPath = args.path;

	/* Templates */
	model_template = [
		"var $0 = Yolo.Model.extend({",							
		"	model_name : '$1',", 														
		"",	
		"	/*",
		"		You can use various validations for attributes.",
		"		See the list of them at: https://github.com/wemakeweb/heythere_appserver#validation",
		"	*/",																
		"	attributes: {", 															
		"$2",																	
		"	},", 
		"",
		"	/*",
		"		We will autogenerate the following views for each default attribute directly, so you dont ",
		"		have to write them:",
		"$4",
		"		Feel free to add custom views here. They will be synced",
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
		"		You can then for example bind 'after' and 'before' Functions to Events.",
		"	*/",
		"	/*",
		"	initialize : function(){", 
		"		// this.before('save', function(){ })",
		"	},",
		"	*/",

		"});",
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
			var verb = "get";

			if(method.indexOf(':') != -1){
				verb = method.split(':');
				method = verb[0];
				verb = verb[1];
			}
			methodsStr.push(tab1 + '/*');
			methodsStr.push(tab2 + '[' + verb.toUpperCase() + '] ' + format(name) + '.' + method);
			methodsStr.push(tab1 + '*/');
			methodsStr.push(tab1 + method + ' : function( params ){ ');
			methodsStr.push(tab2);
			methodsStr.push(tab1 + '},');
			methodsStr.push('');
		});

		controller_template = controller_template.replace(/\$0/g, format(name));
		controller_template = controller_template.replace(/\$1/g, methodsStr.join('\n'));

		if(args.clean){
			controller_template = controller_template.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)/gm
, '');
		}

		fs.writeFileSync(path + '/' + name + '.js', controller_template);
		console.log('\033[34m%s\033[39m' , "Created Controller '" + format(name) + "' at " + path + '/' + name + '.js' + " ✔");

		if(args.route){
			if(fs.existsSync(rootPath + '/../config/routes.js')){
				var routesFile = fs.readFileSync(rootPath + '/../config/routes.js').toString(),
					backup = routesFile + "",
					start = routesFile.match(/module\.exports/),
					openingBracket = false,
					routesLog = [],
					routes = [''];

					if(!start.index){
						console.error('\033[32m%s\033[39m', 'Error while generating route - Your route file might be corrupt.' );
						process.exit(1);
					}

					//search for '{'
					while(routesFile[++start.index]){
						if(routesFile.charAt(start.index) === "{"){
							openingBracket = start.index;
							break;
						}
					}

					if(!openingBracket){
						console.error('\033[32m%s\033[39m', 'Error while generating route' );
						process.exit(1);
					}

					methods.forEach(function(method){
						var verb = "get";

						if(method.indexOf(':') != -1){
							verb = method.split(':');
							method = verb[0];
							verb = verb[1];
						}

						routes.push(tab1 + "'" + name + '/' + method + "': { ");
						routes.push(tab2 + "to: '" + format(name) + '.' + method + "',");
						routes.push(tab2 + "via: '" + verb + "'" );
						routes.push(tab1 + "},");
						routes.push("");
						routesLog.push('\033[34m' + "Added Route [" + verb.toUpperCase() + "] to " + format(name) + '.' + method + " ✔\033[39m");
					});

					routes = routes.join('\n');
					routes = routesFile.slice(0, openingBracket += 2 ) + routes  + routesFile.slice(openingBracket);

					fs.writeFileSync( rootPath + '/../config/routes.js', routes);

					try{
						require(rootPath + '/../config/routes.js');
					} catch(err){
						console.error('\033[32m%s\033[39m', 'Error while generating route - Couldnt add routes, Please add them manually' );
						fs.writeFileSync(rootPath + '/../config/routes.js', backup);
						process.exit(1);
					}

					console.log(routesLog.join('\n'));

			} else {
				console.error('\033[32m%s\033[39m', 'Error while generating route - Couldnt find route file at: ' + rootPath + '/../config/routes.js' );
				process.exit(1);

			}
		}

} else if(args._[0] === "model"){
	var path = args.path + 'models',
		name = args._[1].toLowerCase(),
		attributes = args._.slice(2),
		attributeStr = [],
		validatesStr = [],
		viewsStr = [];

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
				attributeStr.push(tab2 + parts[0] + ' : {' );
				attributeStr.push(tab2 + tab1 + '"default" : null,');
				attributeStr.push(tab2 + tab1 + 'required : true');
				attributeStr.push(tab2  + '},')
			}

			viewsStr.push(tab2 + tab1 + format(name) + '.findBy' + format(parts[0]) );
		} else {
			attributeStr.push(tab2 + attribute + ' : {' );
			attributeStr.push(tab2 + tab1 + '"default" : null,');
			attributeStr.push(tab2 + tab1 + 'required : false');
			attributeStr.push(tab2  + '},')
			viewsStr.push(tab2 + tab1 + format(name) + '.findBy' + format(attribute) );
		}
	});

	model_template = model_template.replace(/\$0/g, format(name));
	model_template = model_template.replace(/\$1/g, name);
	model_template = model_template.replace(/\$2/g, attributeStr.join('\n'));
	model_template = model_template.replace(/\$4/g, viewsStr.join('\n'));

	if(args.clean){
		model_template = model_template.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)/gm
, '');
	}

	fs.writeFileSync(path + '/' + name + '.js', model_template);
	console.log('\033[34m%s\033[39m' , "Created model '" + format(name) + "' at " + path + '/' + name + '.js' + " ✔");
}