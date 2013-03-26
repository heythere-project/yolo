#!/usr/bin/env node
process.title = "[hey]App";

var Yolo = require('./yolo'),
	server = new Yolo();

server.run({
	app : 'app/',
	config : 'config/'
});

console.log("Running!");