'use strict';

const fileFactory = require('./fileFactory');
const processMultipart = require('./processMultipart');
const isEligibleRequest = require('./isEligibleRequest');

const fileUploadOptionsDefaults = {
  safeFileNames: false,
  preserveExtension: false,
  abortOnLimit: false,
  createParentPath: false
};

/**
 * Expose the file upload middleware
 */
module.exports = function(fileUploadOptions) {
  fileUploadOptions = Object.assign({}, fileUploadOptionsDefaults, fileUploadOptions || {});

  return function(req, res, next) {
    if (!isEligibleRequest(req)) {
      return next();
    }

    processMultipart(fileUploadOptions, req, res, next);
  };
};

/**
 * Quietly expose fileFactory; useful for testing
 */
module.exports.fileFactory = fileFactory;
