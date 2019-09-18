'use strict';

const fileFactory = require('./fileFactory');
const processNested = require('./processNested');
const processMultipart = require('./processMultipart');
const isEligibleRequest = require('./isEligibleRequest');
const { buildOptions, debugLog } = require('./utilities');

const DEFAULT_OPTIONS = {
  debug: false,
  uploadTimeout: 60000,
  fileHandler: false,
  uriDecodeFileNames: false,
  safeFileNames: false,
  preserveExtension: false,
  abortOnLimit: false,
  responseOnLimit: 'File size limit has been reached',
  limitHandler: false,
  createParentPath: false,
  parseNested: false,
  useTempFiles: false,
  tempFileDir: '/tmp'
};

/**
 * Expose the file upload middleware
 * @param {Object} options - Middleware options.
 * @returns {Function}
 */
module.exports = (options) => {
  const fileUploadOptions = buildOptions(DEFAULT_OPTIONS, options);

  return (req, res, next) => {
    if (!isEligibleRequest(req)) {
      debugLog(fileUploadOptions, 'Request is not eligible for file upload!');
      return next();
    }
    processMultipart(fileUploadOptions, req, res, next);
  };
};

/**
 * Quietly expose fileFactory and processNested; useful for testing
 */
module.exports.fileFactory = fileFactory;
module.exports.processNested = processNested;
