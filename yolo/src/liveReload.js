var gaze = require('gaze'),
    path = require('path'),
    startup = require('./startup'),
    liveReload;

liveReload  = {
  bind : function(){
    this.gaze = gaze(Yolo.config.liveReload);
    this.gaze.on('changed', _.bind(function(file){  this.event('changed', file) }, this));
    this.gaze.on('added', _.bind(function(file){  this.event('added', file) }, this));
    this.gaze.on('deleted', _.bind(function(file){  this.event('deleted', file) }, this));
  },

  formatName : function(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  type : function(path){
      if(/app\/controllers/.test(path)){
        return "controller";
      }
      if(/app\/models/.test(path)){
        return "model";
      }
  },

  event : function(type, file){
    var fileType = this.type(file),
        fileName = path.basename(file, '.js'),
        itemName = this.formatName(fileName);

        if( fileType in this.handlers ){
          this.handlers[fileType][type](file, itemName);
        }
  },

  handlers : {
     model : {
        added : function(file, name){
          Yolo.logger.info("∞ Added Model '" + name + "'");
          Yolo.models[name] = startup.initializeModel(APP + 'models/', name);
        },

        changed : function(file, name){
          Yolo.logger.info("∞ Reloaded Model '" + name + "'");
          delete Yolo.models[name];
          Yolo.models[name] = startup.initializeModel(APP + 'models/', name);
        },

        deleted : function(file, name){
          Yolo.logger.info("∞ Deleted Model '" + name + "'");
          delete Yolo.models[name];
        }
      },

      controller : {
        added : function(file, name){
          Yolo.logger.info("∞ Added Controller '" + name + "'");
          Yolo.controllers[name] = startup.initializeController(APP + 'controllers/', name);
        },

        changed : function(file, name){
          Yolo.logger.info("∞ Reloaded Controller '" + name + "'");
          delete Yolo.controllers[name];
          Yolo.controllers[name] = startup.initializeController(APP + 'controllers/', name);
        },

        deleted : function(file, name){
          Yolo.logger.info("∞ Deleted Controller '" + name + "'");
          delete Yolo.controllers[name];
        }
    }
  }
};

liveReload.bind();

Yolo.logger.info("∞ Live reload for '" + Yolo.config.liveReload + "'");