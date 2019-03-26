const Busboy = require('busboy');
const fileFactory = require('./fileFactory');
const memHandler = require('./memHandler');
const tempFileHandler = require('./tempFileHandler');
const processNested = require('./processNested');
const {
  buildOptions,
  buildFields,
  parseFileName
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
  let busboyOptions = buildOptions(options, {headers: req.headers});  
  let busboy = new Busboy(busboyOptions);

  // Build multipart req.body fields
  busboy.on('field', (fieldname, val) => req.body = buildFields(req.body, fieldname, val));

  // Build req.files fields
  busboy.on('file', (fieldname, file, filename, encoding, mime) => {

    const {dataHandler, getFilePath, getFileSize, getHash, complete, cleanup} = options.useTempFiles
      ? tempFileHandler(options, fieldname, filename)
      : memHandler(options, fieldname, filename);

    file.on('limit', () => {
      if (options.abortOnLimit) {
        res.writeHead(413, { Connection: 'close' });
        res.end(options.responseOnLimit);
      }
    });

    file.on('data', dataHandler);

    file.on('end', () => {
      const buffer = complete(filename);
      // see: https://github.com/richardgirges/express-fileupload/issues/14
      // firefox uploads empty file in case of cache miss when f5ing page.
      // resulting in unexpected behavior. if there is no file data, the file is invalid.
      if (!buffer.length && !options.useTempFiles) {
        return;
      }

      // Add file instance to the req.files
      req.files = buildFields(req.files, fieldname, fileFactory(
        {
          name: parseFileName(options, filename),
          buffer,
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
