const Busboy = require('busboy');
const fileFactory = require('./fileFactory');
const memHandler = require('./memHandler');
const tempFileHandler = require('./tempFileHandler');
const processNested = require('./processNested');

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
module.exports = function processMultipart(options, req, res, next) {
  let busboyOptions = {};
  let busboy;

  req.files = null;

  // Build busboy config
  for (let k in options) {
    if (Object.prototype.hasOwnProperty.call(options, k)) {
      busboyOptions[k] = options[k];
    }
  }

  // Attach request headers to busboy config
  busboyOptions.headers = req.headers;

  // Init busboy instance
  busboy = new Busboy(busboyOptions);

  // Build multipart req.body fields
  busboy.on('field', function(fieldname, val) {
    req.body = req.body || {};

    let prev = req.body[fieldname];

    if (!prev) {
      return (req.body[fieldname] = val);
    }

    if (Array.isArray(prev)) {
      return prev.push(val);
    }

    req.body[fieldname] = [prev, val];
  });

  // Build req.files fields
  busboy.on('file', function(fieldname, file, filename, encoding, mime) {

    const {dataHandler, getFilePath, getFileSize, complete, cleanup} = options.useTempFiles
      ? tempFileHandler(options, fieldname, filename)
      : memHandler(options, fieldname, filename);

    file.on('limit', () => {
      if (options.abortOnLimit) {
        res.writeHead(413, { Connection: 'close' });
        res.end('File size limit has been reached');
      }
    });

    file.on('data', dataHandler);

    file.on('end', function() {
      if (!req.files) {
        req.files = {};
      }

      const buffer = complete(filename);
      // see: https://github.com/richardgirges/express-fileupload/issues/14
      // firefox uploads empty file in case of cache miss when f5ing page.
      // resulting in unexpected behavior. if there is no file data, the file is invalid.
      if (!buffer.length && !options.useTempFiles) {
        return;
      }

      if (options.safeFileNames) {
        let safeFileNameRegex = /[^\w-]/g;
        let maxExtensionLength = 3;
        let extension = '';

        if (typeof options.safeFileNames === 'object') {
          safeFileNameRegex = options.safeFileNames;
        }

        maxExtensionLength = parseInt(options.preserveExtension);
        if (options.preserveExtension || maxExtensionLength === 0) {
          if (isNaN(maxExtensionLength)) {
            maxExtensionLength = 3;
          } else {
            maxExtensionLength = Math.abs(maxExtensionLength);
          }

          let filenameParts = filename.split('.');
          let filenamePartsLen = filenameParts.length;
          if (filenamePartsLen > 1) {
            extension = filenameParts.pop();

            if (
              extension.length > maxExtensionLength &&
              maxExtensionLength > 0
            ) {
              filenameParts[filenameParts.length - 1] +=
                '.' +
                extension.substr(0, extension.length - maxExtensionLength);
              extension = extension.substr(-maxExtensionLength);
            }

            extension = maxExtensionLength
              ? '.' + extension.replace(safeFileNameRegex, '')
              : '';
            filename = filenameParts.join('.');
          }
        }

        filename = filename.replace(safeFileNameRegex, '').concat(extension);
      }

      const newFile = fileFactory(
        {
          name: filename,
          buffer,
          tempFilePath: getFilePath(),
          size: getFileSize(),
          encoding,
          truncated: file.truncated,
          mimetype: mime
        },
        options
      );

      // Non-array fields
      if (!req.files.hasOwnProperty(fieldname)) {
        req.files[fieldname] = newFile;
      } else {
        // Array fields
        if (req.files[fieldname] instanceof Array) {
          req.files[fieldname].push(newFile);
        } else {
          req.files[fieldname] = [req.files[fieldname], newFile];
        }
      }
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
