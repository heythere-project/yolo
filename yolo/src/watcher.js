var gaze = require('gaze');

// Watch all .js files in process.cwd()/app/**
gaze( Yolo.config.liveReload, function(err, watcher) {
  // Files have all started watching
  // watcher === this
  Yolo.logger.info("Live reload for '" + Yolo.config.liveReload + "'");

  // On file changed
  this.on('changed', function(filepath) {
    console.log(filepath + ' was changed');
  });

  // On file added
  this.on('added', function(filepath) {
    console.log(filepath + ' was added');
  });

  // On file deleted
  this.on('deleted', function(filepath) {
    console.log(filepath + ' was deleted');
  });

  // On changed/added/deleted
  this.on('all', function(event, filepath) {
    //console.log(filepath + ' was ' + event);
  });

  // Get watched files with relative paths
  //console.log(this.relative());
});
