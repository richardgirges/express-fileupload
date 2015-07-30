var busboy, fs;

busboy = require('connect-busboy');

fs = require('fs-extra');

module.exports = function(options) {
  options = options || {};
  return function(req, res, next) {
    return busboy(options)(req, res, function() {
      if (!req.busboy) {
        return next();
      }
      req.files = null;
      req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        file.on('data', function(data) {
          if (options.debug) {
            return console.log('Uploading %s -> %s', fieldname, filename);
          }
        });
        return file.on('end', function() {
          if (!req.files) {
            req.files = {};
          }
          return req.files[fieldname] = {
            name: filename,
            data: file,
            encoding: encoding,
            mimetype: mimetype,
            mv: function(path, callback) {
              var fstream;
              fstream = fs.createWriteStream(path);
              this.data.pipe(fstream);
              fstream.on('error', function(error) {
                return callback(error);
              });
              return fstream.on('close', function() {
                return callback(null);
              });
            }
          };
        });
      });
      req.busboy.on('finish', next);
      return req.pipe(req.busboy);
    });
  };
};
