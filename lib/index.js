'use strict';

const fileFactory = require('./fileFactory');
const processMultipart = require('./processMultipart');
const isEligibleRequest = require('./isEligibleRequest');
const processNested = require('./processNested');
const {buildOptions} = require('./utilities');

const fileUploadOptionsDefaults = {
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
 */
module.exports = (fileUploadOptions) => {
  fileUploadOptions = buildOptions(fileUploadOptionsDefaults, fileUploadOptions);

  return function(req, res, next){
    if (!isEligibleRequest(req)) {
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
