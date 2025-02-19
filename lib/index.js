'use strict';

const path = require('path');
const processMultipart = require('./processMultipart');
const isEligibleRequest = require('./isEligibleRequest');
const { buildOptions, debugLog } = require('./utilities');

const DEFAULT_OPTIONS = {
  debug: false,
  logger: console,
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
  tempFileDir: path.join(process.cwd(), 'tmp'),
  tempFilePermissions: 0o644,
  hashAlgorithm: 'md5',
  enableMimeTypeValidation: false, // New option for enabling MIME type validation
  acceptableMimeTypes: [], // New option to specify acceptable MIME types
  rejectPolyglotFiles: false, // New option to reject polyglot files
  enablePdfSanitization: false // New option to enable PDF sanitization
};

/**
 * Expose the file upload middleware
 * @param {DEFAULT_OPTIONS & busboy.BusboyConfig} options - Middleware options.
 * @returns {Function} - express-fileupload middleware.
 */
module.exports = (options) => {
  const uploadOptions = buildOptions(DEFAULT_OPTIONS, options);
  return (req, res, next) => {
    if (!isEligibleRequest(req)) {
      debugLog(uploadOptions, 'Request is not eligible for file upload!');
      return next();
    }
    processMultipart(uploadOptions, req, res, (err) => {
      if (err && err.message.includes('Polyglot file detected')) {
        debugLog(uploadOptions, 'Polyglot file detected and rejected.');
        if (uploadOptions.rejectPolyglotFiles) {
          return res.status(400).send('Polyglot files are not allowed.');
        }
      }
      next(err);
    });
  };
};