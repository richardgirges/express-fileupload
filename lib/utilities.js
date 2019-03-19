'use strict';

const fs = require('fs');
const path = require('path');
const Readable = require('stream').Readable;

//Parameters which used to generate unique temporary file names:
const TEMP_COUNTER_MAX = 65536;
const TEMP_PREFIX = 'tmp';
let tempCounter = 0;

/**
 * Generates unique temporary file name like: tmp-5000-156788789789.
 * @param prefix {String} - a prefix for generated unique file name.
 */
const getTempFilename = (prefix) => {
  prefix = prefix || TEMP_PREFIX;
  tempCounter ++;
  if (tempCounter > TEMP_COUNTER_MAX) tempCounter = 1;
  return `${prefix}-${tempCounter}-${Date.now()}`;
};

/**
 * Returns true if argument is function.
 */
const isFunc = func => func && func.constructor && func.call && func.apply ? true: false;

/**
 * Builds instanse options from arguments objects.
 * @returns {Object} - result options.
 */
const buildOptions = function(){
  let result = {};
  [...arguments].forEach(options => {
    if (!options || typeof options !== 'object') return;
    Object.keys(options).forEach(key => result[key] = options[key]);
  });
  return result;
};

/**
 * Creates a folder for file specified in the path variable
 * @param {Object} fileUploadOptions
 * @param {String} filePath
 */
const checkAndMakeDir = function(fileUploadOptions, filePath){
  //Check upload options were set.
  if (!fileUploadOptions) return false;
  if (!fileUploadOptions.createParentPath) return false;
  //Check whether folder for the file exists.
  if (!filePath) return false;
  const parentPath = path.dirname(filePath);
  //Create folder if it is not exists.
  if (!fs.existsSync(parentPath)) fs.mkdirSync(parentPath); 
  return true;
};

/**
 * Copy file via streams
 * @param {String} src - Path to the source file
 * @param {String} dst - Path to the destination file.
 */
const copyFile = function(src, dst, callback){
  //cbCalled flag and runCb helps to run cb only once.
  let cbCalled = false;
  let runCb = (err) => {
    if (cbCalled) return;
    cbCalled = true;
    callback(err);
  };
  //Create read stream
  let readable = fs.createReadStream(src);
  readable.on('error', runCb);
  //Create write stream
  let writable = fs.createWriteStream(dst);
  writable.on('error', (err)=>{
    readable.destroy();
    runCb(err);
  });
  writable.on('close', () => runCb());
  //Copy file via piping streams.
  readable.pipe(writable);
};

/**
 * Save buffer data to a file.
 * @param {Buffer} buffer - buffer to save to a file.
 * @param {String} filePath - path to a file.
 */
const saveBufferToFile = function(buffer, filePath, callback){
  if (!Buffer.isBuffer(buffer)){
    callback(new Error('buffer variable should be a Buffer!'));
    return;
  }
  //Setup readable stream from buffer.
  let streamData = buffer;
  let readStream = Readable();
  readStream._read = ()=>{
    readStream.push(streamData);
    streamData = null;
  };
  //Setup file system writable stream.
  let fstream = fs.createWriteStream(filePath);
  fstream.on('error', error => callback(error));
  fstream.on('close', () => callback());
  //Copy file via piping streams.
  readStream.pipe(fstream);
};

module.exports = {
  isFunc,
  buildOptions,
  checkAndMakeDir,
  copyFile,
  saveBufferToFile,
  getTempFilename
};
