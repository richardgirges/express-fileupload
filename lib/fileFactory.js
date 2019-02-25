'use strict';

const fs = require('fs');
const path = require('path');
const streamifier = require('streamifier');
const md5 = require('md5');

/**
 * Creates a folder for file specified in the path variable
 * @param {Object} fileUploadOptions
 * @param {String} filePath
 */
const checkAndMakeDir = function(fileUploadOptions, filePath){
  if (fileUploadOptions && fileUploadOptions.createParentPath) {
    const parentPath = path.dirname(filePath);
    if (!fs.existsSync(parentPath)) {
      fs.mkdirSync(parentPath);
    }
  }
}

/**
 * Returns Local function that moves the file to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 * @param {String} filePath
 * @param {Object} options
 */
const moveFromTemp = function(filePath, options) {
  return function(successFunc, errorFunc){
    fs.rename(options.tempFilePath, filePath, function(err){
      if (err) {
        errorFunc(err);
      } else {
        successFunc();
      }
    });
  };
}

/**
 * Returns Local function that moves the file from buffer to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 * @param {String} filePath
 * @param {Object} options
 */
function moveFromBuffer(filePath, options) {
  return function(successFunc, errorFunc){
    const fstream = fs.createWriteStream(filePath);
    streamifier.createReadStream(options.buffer).pipe(fstream);
    fstream.on('error', function(error) {
      errorFunc(error);
    });
    fstream.on('close', function() {
      successFunc();
    });
  };
}

module.exports = function(options, fileUploadOptions = null) {
  return {
    name: options.name,
    data: options.buffer,
    size: options.size,
    encoding: options.encoding,
    tempFilePath: options.tempFilePath,
    truncated: options.truncated,
    mimetype: options.mimetype,
    md5: () => md5(options.buffer),
    mv: function(filePath, callback) {
      // Determine propper move function.
      let move = (options.buffer.length && !options.tempFilePath)
        ? moveFromBuffer(filePath, options)
        : moveFromTemp(filePath, options);
      // Create a folder for file.
      checkAndMakeDir(fileUploadOptions, filePath);
      // Callback is passed in, use the callback API
      if (callback && callback.constructor && callback.call && callback.apply) {
        move(
          () => {
            callback(null);
          },
          error => {
            callback(error);
          }
        );
        // Otherwise, return a promise
      } else {
        return new Promise((resolve, reject) => {
          move(resolve, reject);
        });
      }
    }
  };
};
