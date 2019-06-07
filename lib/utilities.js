'use strict';

const fs = require('fs');
const path = require('path');
const Readable = require('stream').Readable;

// Parameters for safe file name parsing.
const SAFE_FILE_NAME_REGEX = /[^\w-]/g;
const MAX_EXTENSION_LENGTH = 3;

// Parameters which used to generate unique temporary file names:
const TEMP_COUNTER_MAX = 65536;
const TEMP_PREFIX = 'tmp';
let tempCounter = 0;

/**
 * Logs message to console if debug option set to true.
 * @param {Object} options - options object.
 * @param {String} msg     - message to log.
 * @returns {Boolean}
 */
const debugLog = (options, msg) => {
  options = options || {};
  if (!options.debug) return false;
  console.log(msg); // eslint-disable-line
  return true;
};

/**
 * Generates unique temporary file name like: tmp-5000-156788789789.
 * @param prefix {String} - a prefix for generated unique file name.
 * @returns {String}
 */
const getTempFilename = (prefix) => {
  prefix = prefix || TEMP_PREFIX;
  tempCounter = tempCounter >= TEMP_COUNTER_MAX ? 1 : tempCounter + 1;
  return `${prefix}-${tempCounter}-${Date.now()}`;
};

/**
 * Returns true if argument is a function.
 * @returns {Boolean}
 */
const isFunc = func => func && func.constructor && func.call && func.apply ? true: false;

/**
 * Set errorFunc to the same value as successFunc for callback mode.
 * @returns {Function}
 */
const errorFunc = (resolve, reject) => isFunc(reject) ? reject : resolve;

/**
 * Return a callback function for promise resole/reject args.
 * @returns {Function}
 */
const promiseCallback = (resolve, reject) => {
  return err => err ? errorFunc(resolve, reject)(err) : resolve();
};

/**
 * Builds instance options from arguments objects(can't be arrow function).
 * @returns {Object} - result options.
 */
const buildOptions = function(){
  const result = {};
  [...arguments].forEach(options => {
    if (!options || typeof options !== 'object') return;
    Object.keys(options).forEach(key => result[key] = options[key]);
  });
  return result;
};

/**
 * Builds request fields (using to build req.body and req.files)
 * @param {Object} instance - request object.
 * @param {String} field    - field name.
 * @param value             - field value.
 * @returns {Object}
 */
const buildFields = (instance, field, value) => {
  // Do nothing if value is not set.
  if (value === null || value === undefined) return instance;
  instance = instance || {};
  // Non-array fields
  if (!instance[field]) {
    instance[field] = value;
  } else {
  // Array fields  
    if (instance[field] instanceof Array) {
      instance[field].push(value);
    } else {
      instance[field] = [instance[field], value];
    }
  }
  return instance;
};

/**
 * Creates a folder for file specified in the path variable
 * @param {Object} fileUploadOptions
 * @param {String} filePath
 * @returns {Boolean}
 */
const checkAndMakeDir = (fileUploadOptions, filePath) => {
  // Check upload options were set.
  if (!fileUploadOptions) return false;
  if (!fileUploadOptions.createParentPath) return false;
  // Check whether folder for the file exists.
  if (!filePath) return false;
  const parentPath = path.dirname(filePath);
  // Create folder if it is not exists.
  if (!fs.existsSync(parentPath)) fs.mkdirSync(parentPath, { recursive: true }); 
  // Checks folder again and return a results.
  return fs.existsSync(parentPath);
};

/**
 * Delete file.
 * @param {String} file - Path to the file to delete.
 */
const deleteFile = (file, callback) => fs.unlink(file, err => err ? callback(err) : callback());

/**
 * Copy file via streams
 * @param {String} src - Path to the source file
 * @param {String} dst - Path to the destination file.
 */
const copyFile = (src, dst, callback) => {
  // cbCalled flag and runCb helps to run cb only once.
  let cbCalled = false;
  let runCb = (err) => {
    if (cbCalled) return;
    cbCalled = true;
    callback(err);
  };
  // Create read stream
  let readable = fs.createReadStream(src);
  readable.on('error', runCb);
  // Create write stream
  let writable = fs.createWriteStream(dst);
  writable.on('error', (err)=>{
    readable.destroy();
    runCb(err);
  });
  writable.on('close', () => runCb());
  // Copy file via piping streams.
  readable.pipe(writable);
};

/**
 * Move file via streams by copieng and the deleteing src.
 * @param {String}   src      - Path to the source file
 * @param {String}   dst      - Path to the destination file.
 * @param {Function} callback - A callback function.
 */
const moveFile = (src, dst, callback) => {
  // Copy file to dst and delete src whether success.
  copyFile(src, dst, err => err ? callback(err) : deleteFile(src, callback));
};

/**
 * Save buffer data to a file.
 * @param {Buffer} buffer - buffer to save to a file.
 * @param {String} filePath - path to a file.
 */
const saveBufferToFile = (buffer, filePath, callback) => {
  if (!Buffer.isBuffer(buffer)) {
    return callback(new Error('buffer variable should be type of Buffer!'));
  }
  // Setup readable stream from buffer.
  let streamData = buffer;
  let readStream = Readable();
  readStream._read = () => {
    readStream.push(streamData);
    streamData = null;
  };
  // Setup file system writable stream.
  let fstream = fs.createWriteStream(filePath);
  fstream.on('error', error => callback(error));
  fstream.on('close', () => callback());
  // Copy file via piping streams.
  readStream.pipe(fstream);
};

/**
 * Decodes uriEncoded file names.
 * @param fileName {String} - file name to decode.
 * @returns {String}
 */
const uriDecodeFileName = (opts, fileName) => {
  return opts.uriDecodeFileNames ? decodeURIComponent(fileName) : fileName;
};

/**
 * Parses filename and extension and returns object {name, extension}.
 * @param preserveExtension {Boolean, Integer} - true/false or number of characters for extension.
 * @param fileName {String}                    - file name to parse.
 * @returns {Object}                           - {name, extension}.
 */
const parseFileNameExtension = (preserveExtension, fileName) => {
  const preserveExtensionLengh = parseInt(preserveExtension);
  const result = {name: fileName, extension: ''};
  if (!preserveExtension && preserveExtensionLengh !== 0) return result;
  // Define maximum extension length
  const maxExtLength = isNaN(preserveExtensionLengh)
    ? MAX_EXTENSION_LENGTH
    : Math.abs(preserveExtensionLengh);

  const nameParts = fileName.split('.');
  if (nameParts.length < 2) return result;
  
  let extension = nameParts.pop();
  if (
    extension.length > maxExtLength &&
    maxExtLength > 0
  ) {
    nameParts[nameParts.length - 1] +=
      '.' +
      extension.substr(0, extension.length - maxExtLength);
    extension = extension.substr(-maxExtLength);
  }

  result.extension = maxExtLength ? extension : '';
  result.name = nameParts.join('.');
  return result;
};

/**
 * Parse file name and extension.
 * @param opts {Object}     - middleware options.
 * @param fileName {String} - Uploaded file name.
 * @returns {String}
 */
const parseFileName = (opts, fileName) => {
  if (!opts.safeFileNames) return fileName;
  // Set regular expression for the file name.
  const nameRegex = typeof opts.safeFileNames === 'object' && opts.safeFileNames instanceof RegExp
    ? opts.safeFileNames
    : SAFE_FILE_NAME_REGEX;
  // Parse file name extension.
  let {name, extension} = parseFileNameExtension(opts.preserveExtension, fileName);
  if (extension.length) extension = '.' + extension.replace(nameRegex, '');

  return name.replace(nameRegex, '').concat(extension);
};

module.exports = {
  debugLog,
  isFunc,
  errorFunc,
  promiseCallback,
  buildOptions,
  buildFields,
  checkAndMakeDir,
  deleteFile,         // For testing purpose.
  copyFile,           // For testing purpose.
  moveFile,
  saveBufferToFile,
  parseFileName,
  getTempFilename,
  uriDecodeFileName
};
