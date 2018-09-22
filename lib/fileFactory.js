'use strict';

const fs = require('fs');
const path = require('path');
const streamifier = require('streamifier');
const md5 = require('md5');

module.exports = function(options, fileUploadOptions = null) {
  return {
    name: options.name,
    data: options.buffer,
    encoding: options.encoding,
    truncated: options.truncated,
    mimetype: options.mimetype,
    md5: () => md5(options.buffer),
    mv: function(filePath, callback) {
      // Callback is passed in, use the callback API
      if (callback) {
        doMove(
          () => {
            callback(null);
          },
          (error) => {
            callback(error);
          }
        );

      // Otherwise, return a promise
      } else {
        return new Promise((resolve, reject) => {
          doMove(resolve, reject);
        });
      }

      /**
       * Local function that moves the file to a different location on the filesystem
       * Takes two function arguments to make it compatible w/ Promise or Callback APIs
       * @param {Function} successFunc
       * @param {Function} errorFunc
       */
      function doMove(successFunc, errorFunc) {
        if (fileUploadOptions && fileUploadOptions.createParentPath) {
          const parentPath = path.dirname(filePath);
          if (!fs.existsSync(parentPath)) {
            fs.mkdirSync(parentPath);
          }
        }

        const fstream = fs.createWriteStream(filePath);

        streamifier.createReadStream(options.buffer).pipe(fstream);

        fstream.on('error', function(error) {
          errorFunc(error);
        });

        fstream.on('close', function() {
          successFunc();
        });
      }
    }
  };
};
