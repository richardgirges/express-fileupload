const Busboy = require('busboy');
const fileFactory = require('./fileFactory');
const memHandler = require('./memHandler');
const tempFileHandler = require('./tempFileHandler');
const processNested = require('./processNested');
const {
  isFunc,
  debugLog,
  buildFields,
  buildOptions,
  parseFileName,
  uriDecodeFileName
} = require('./utilities');

/**
 * Processes multipart request
 * Builds a req.body object for fields
 * Builds a req.files object for files
 * @param  {Object}   options expressFileupload and Busboy options
 * @param  {Object}   req     Express request object
 * @param  {Object}   res     Express response object
 * @param  {Function} next    Express next method
 * @return {void}
 */
module.exports = (options, req, res, next) => {
  req.files = null;

  // Build busboy options and init busboy instance.
  const busboyOptions = buildOptions(options, { headers: req.headers });
  const busboy = new Busboy(busboyOptions);

  // Close connection with specified reason and http code, default: 400 Bad Request.
  const closeConnection = (code, reason) => {
    req.unpipe(busboy);
    res.writeHead(code || 400, { Connection: 'close' });
    res.end(reason || 'Bad Request');
  };

  // Build multipart req.body fields
  busboy.on('field', (field, val) => req.body = buildFields(req.body, field, val));

  // Build req.files fields
  busboy.on('file', (field, file, name, encoding, mime) => {
    // Define upload timer settings
    let uploadTimer = null;
    const timeout = options.uploadTimeout;
    // Decode file name if uriDecodeFileNames option set true.
    const filename = uriDecodeFileName(options, name);
    // Define methods and handlers for upload process.
    const {dataHandler, getFilePath, getFileSize, getHash, complete, cleanup} = options.useTempFiles
      ? tempFileHandler(options, field, filename) // Upload into temporary file.
      : memHandler(options, field, filename);     // Upload into RAM.

    file.on('limit', () => {
      debugLog(options, `Size limit reached for ${field}->${filename}, bytes:${getFileSize()}`);
      // Reset upload timer in case of file limit reached.
      clearTimeout(uploadTimer);
      // Run a user defined limit handler if it has been set.
      if (isFunc(options.limitHandler)) return options.limitHandler(req, res, next);
      // Close connection with 413 code and do cleanup if abortOnLimit set(default: false).
      if (options.abortOnLimit) {
        debugLog(options, `Aborting upload because of size limit ${field}->${filename}.`);
        closeConnection(413, options.responseOnLimit);
        cleanup();
      }
    });

    file.on('data', (data) => {
      // Reset and set new upload timer each time when new data came.
      clearTimeout(uploadTimer);
      uploadTimer = setTimeout(() => {
        debugLog(options, `Upload timeout ${field}->${filename}, bytes:${getFileSize()}`);
        cleanup();
      }, timeout);
      // Handle new piece of data.
      dataHandler(data);
    });

    file.on('end', () => {
      // Debug logging for a new file upload.
      debugLog(options, `Upload finished ${field}->${filename}, bytes:${getFileSize()}`);
      // Reset upload timer in case of end event.
      clearTimeout(uploadTimer);
      // Add file instance to the req.files
      req.files = buildFields(req.files, field, fileFactory({
        buffer: complete(),
        name: parseFileName(options, filename),
        tempFilePath: getFilePath(),
        size: getFileSize(),
        hash: getHash(),
        encoding,
        truncated: file.truncated,
        mimetype: mime
      }, options));
    });

    file.on('error', (err) => {
      // Reset upload timer in case of errors.
      clearTimeout(uploadTimer);
      debugLog(options, `Error ${field}->${filename}, bytes:${getFileSize()}, error:${err}`);
      cleanup();
      next();
    });

    // Debug logging for a new file upload.
    debugLog(options, `New upload started ${field}->${filename}, bytes:${getFileSize()}`);
  });

  busboy.on('finish', () => {
    if (options.parseNested) {
      req.body = processNested(req.body);
      req.files = processNested(req.files);
    }
    next();
  });

  busboy.on('error', next);

  req.pipe(busboy);
};
