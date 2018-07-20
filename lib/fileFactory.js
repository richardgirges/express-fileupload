'use strict';

const fs = require('fs-extra');
const streamifier = require('streamifier');
const md5 = require('md5');

module.exports = function(options) {
  let output = {
    name: options.name,
    data: options.buffer,
    encoding: options.encoding,
    tempFilePath: options.tempFilePath,
    truncated: options.truncated,
    mimetype: options.mimetype,
    md5: (function() {
      if (options.buffer) {
        return md5(options.buffer);
      }
    })(), // @todo: this
    mv: function(path, callback) {
      // Callback is passed in, use the callback API
      if (callback) {
        if (options.buffer) {
          doMoveFromBuffer(
            () => {
              callback(null);
            },
            (error) => {
              callback(error);
            }
          );
        } else if (options.tempFilePath) {
          doMoveFromTempFile(
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
          if (options.buffer) {
            doMoveFromBuffer(resolve, reject);
          } else {
            doMoveFromTempFile(resolve, reject);
          }
        });
      }

      /**
       * Local function that moves the file to a different location on the filesystem
       * via the fs library
       * Takes two function arguments to make it compatible w/ Promise or Callback APIs
       * @param {Function} successFunc
       * @param {Function} errorFunc
       */
      function doMoveFromTempFile(successFunc, errorFunc) {
        fs.rename(options.tempFilePath, path, function(err) {
          if (err) {
            errorFunc(err);
          } else {
            successFunc();
          }
        });
      }

      /**
       * Local function that moves the file to a different location on the filesystem by
       * streaming the memory buffer
       * Takes two function arguments to make it compatible w/ Promise or Callback APIs
       * @param {Function} successFunc
       * @param {Function} errorFunc
       */
      function doMoveFromBuffer(successFunc, errorFunc) {
        const fstream = fs.createWriteStream(path);

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

  if (options.size) {
    output.size = options.size;
  }

  return output;
};
