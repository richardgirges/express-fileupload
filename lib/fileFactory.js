'use strict';

const {
  isFunc,
  promiseCallback,
  checkAndMakeDir,
  moveFile,
  saveBufferToFile
} = require('./utilities');

/**
 * Returns Local function that moves the file to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 * @param {String} filePath - destination file path.
 * @param {Object} options
 * @returns {Function}
 */
const moveFromTemp = (filePath, options) => {
  return (resolve, reject) => {
    moveFile(options.tempFilePath, filePath, promiseCallback(resolve, reject));
  };
};

/**
 * Returns Local function that moves the file from buffer to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 * @param {String} filePath - destination file path.
 * @param {Object} options
 * @returns {Function}
 */
const moveFromBuffer = (filePath, options) => {
  return (resolve, reject) => {
    saveBufferToFile(options.buffer, filePath, promiseCallback(resolve, reject));
  };
};

module.exports = (options, fileUploadOptions = {}) => {
  // see: https://github.com/richardgirges/express-fileupload/issues/14
  // firefox uploads empty file in case of cache miss when f5ing page.
  // resulting in unexpected behavior. if there is no file data, the file is invalid.
  if (!fileUploadOptions.useTempFiles && !options.buffer.length) return;
  
  // Create and return file object.
  return {
    name: options.name,
    data: options.buffer,
    size: options.size,
    encoding: options.encoding,
    tempFilePath: options.tempFilePath,
    truncated: options.truncated,
    mimetype: options.mimetype,
    md5: options.hash,
    mv: (filePath, callback) => {
      // Determine a propper move function.
      let moveFunc = (options.buffer.length && !options.tempFilePath)
        ? moveFromBuffer(filePath, options)
        : moveFromTemp(filePath, options);
      // Create a folder for a file.
      checkAndMakeDir(fileUploadOptions, filePath);
      // If callback is passed in, use the callback API, otherwise return a promise.
      return isFunc(callback)
        ? moveFunc(callback)
        : new Promise(moveFunc);
    }
  };
};
