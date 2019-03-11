'use strict';

const fs = require('fs');
const {
  isFunc,
  checkAndMakeDir,
  copyFile,
  saveBufferToFile
} = require('./utilities.js');

/**
 * Returns Local function that moves the file to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 * @param {String} filePath
 * @param {Object} options
 */
const moveFromTemp = function(filePath, options) {
  return function(successFunc, errorFunc){
    // Set errorFunc to the same value as successFunc for callback mode.
    errorFunc = isFunc(errorFunc) ? errorFunc : successFunc;
    // Copy temporary file.
    copyFile(options.tempFilePath, filePath, function(err){
      if (err) {
        errorFunc(err);
        return;
      }
      // Delete temporary file.
      fs.unlink(options.tempFilePath, (err) => {
        if (err) {
          errorFunc(err);
        } else {
          successFunc();
        }
      });
    });
  };
};

/**
 * Returns Local function that moves the file from buffer to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 * @param {String} filePath
 * @param {Object} options
 */
const moveFromBuffer = function(filePath, options) {
  return function(successFunc, errorFunc){
    // Set errorFunc to the same value as successFunc for callback mode.
    errorFunc = isFunc(errorFunc) ? errorFunc : successFunc;
    saveBufferToFile(options.buffer, filePath, function(err){
      if (err) {
        errorFunc(err);
      } else {
        successFunc();
      }
    });
  };
};

module.exports = function(options, fileUploadOptions = null) {
  return {
    name: options.name,
    data: options.buffer,
    size: options.size,
    encoding: options.encoding,
    tempFilePath: options.tempFilePath,
    truncated: options.truncated,
    mimetype: options.mimetype,
    md5: options.hash,
    mv: function(filePath, callback) {
      // Determine propper move function.
      let moveFunc = (options.buffer.length && !options.tempFilePath)
        ? moveFromBuffer(filePath, options)
        : moveFromTemp(filePath, options);
      // Create a folder for file.
      checkAndMakeDir(fileUploadOptions, filePath);
      // If callback is passed in, use the callback API, otherwise return a promise.
      return isFunc(callback)
        ? moveFunc(callback)
        : new Promise((resolve, reject) => moveFunc(resolve, reject));
    }
  };
};
