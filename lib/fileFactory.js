'use strict';

const fs = require('fs');
const path = require('path');
const streamifier = require('streamifier');
const md5 = require('md5');

module.exports = function(options, fileUploadOptions = null) {
  const output = {
    name: options.name,
    data: options.buffer,
    encoding: options.encoding,
    truncated: options.truncated,
    mimetype: options.mimetype,
    md5: () => md5(options.buffer),
    mv: function(filePath, callback) {
      // Callback is passed in, use the callback API
      if (callback) {
        if(!options.buffer){
          doMoveFromTemp(
            () => {
              callback(null);
            },
            (error) => {
              callback(error);
            }
          );
        } else {
          doMoveFromBuffer(
            () => {
              callback(null);
            },
          (error) => {
            callback(error);
          }
        );
}

      // Otherwise, return a promise
      } else {
        return new Promise((resolve, reject) => {
          if(options.buffer) {
            doMoveFromBuffer(resolve, reject);
          } else {
            doMoveFromTemp(resolve, reject);
          }
        });
      }

      /**
       * Local function that moves the file to a different location on the filesystem
       * Takes two function arguments to make it compatible w/ Promise or Callback APIs
       * @param {Function} successFunc
       * @param {Function} errorFunc
       */
      function doMoveFromTemp(successFunc, errorFunc){
        fs.rename(options.tempFilePath, path, function(err){
          if(err) {
            errorFunc(err);
          } else {
            successFunc();
          }
        })
      }
      function doMoveFromBuffer(successFunc, errorFunc) {
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
  if(options.size){
    output.size = options.size
  }
  return output;
};
