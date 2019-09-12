const Busboy = require('busboy');
const fileFactory = require('./fileFactory');
const memHandler = require('./memHandler');
const tempFileHandler = require('./tempFileHandler');
const processNested = require('./processNested');
const {
  isFunc,
  debugLog,
  buildOptions,
  buildFields,
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

  // Close connection with specified reason and http code, default: 400 Bad Request.
  const closeConnection = (code, reason) => {
    req.unpipe(busboy);
    res.writeHead(code || 400, { Connection: 'close' });
    res.end(reason || 'Bad Request');
  };

  // Build busboy options and init busboy instance.
  let busboyOptions = buildOptions(options, {headers: req.headers});  
  let busboy = new Busboy(busboyOptions);

  // Build multipart req.body fields
  busboy.on('field', (fieldname, val) => req.body = buildFields(req.body, fieldname, val));

  // Build req.files fields
  busboy.on('file', (fieldname, file, name, encoding, mime) => {
    // Decode file name if uriDecodeFileNames option set true.
    const filename = uriDecodeFileName(options, name);
    
    const {dataHandler, getFilePath, getFileSize, getHash, complete, cleanup} = options.useTempFiles
      ? tempFileHandler(options, fieldname, filename)
      : memHandler(options, fieldname, filename);

    file.on('limit', () => {
      debugLog(options, `Size limit reached for ${fieldname}->${filename}, bytes:${getFileSize()}`);
      // Run user defined limit handler if it has been set.
      if (isFunc(options.limitHandler)){
        return options.limitHandler(req, res, next);
      }
      // Close connection with 413 code if abortOnLimit set(default: false).
      if (options.abortOnLimit) {
        debugLog(options, `Aborting upload because of size limit ${fieldname}->${filename}!`);
        closeConnection(413, options.responseOnLimit);
        cleanup();
      }
    });

    file.on('data', dataHandler);

    file.on('end', () => {
      // Debug logging for a new file upload.
      debugLog(options, `Upload finished ${fieldname}->${filename}, bytes:${getFileSize()}`);
      // Add file instance to the req.files
      req.files = buildFields(req.files, fieldname, fileFactory(
        {
          buffer: complete(),
          name: parseFileName(options, filename),
          tempFilePath: getFilePath(),
          size: getFileSize(),
          hash: getHash(),
          encoding,
          truncated: file.truncated,
          mimetype: mime
        },
        options
      ));
    });
    
    file.on('error', cleanup, next);

    // Debug logging for a new file upload.
    debugLog(options, `New upload started ${fieldname}->${filename}, bytes:${getFileSize()}`);
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
