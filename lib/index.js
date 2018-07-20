'use strict';

const Busboy = require('busboy');
const fs = require('fs');
const fileFactory = require('./fileFactory');

const ACCEPTABLE_MIME = /^(?:multipart\/.+)$/i;
const UNACCEPTABLE_METHODS = [
  'GET',
  'HEAD'
];

module.exports = function(options) {
  options = options || {};

  return function(req, res, next) {
    if (!hasBody(req) || !hasAcceptableMethod(req) || !hasAcceptableMime(req)) {
      return next();
    }

    processMultipart(options, req, res, next);
  };
};

module.exports.fileFactory = fileFactory;

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
function processMultipart(options, req, res, next) {
  let busboyOptions = {};
  let busboy;

  // 60 second time-out for data chunks
  let timeoutThreshhold = 60000;

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
  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mime) {
    req.body = req.body || {};

    let prev = req.body[fieldname];

    if (!prev) {
      return req.body[fieldname] = val;
    }

    if (Array.isArray(prev)) {
      return prev.push(val);
    }

    req.body[fieldname] = [prev, val];
  });


  // handles uploaded chunks in memory. Not great for large files.
  let memoryUploadHandler = function(fieldname, file, filename, encoding, mime) {
    const buffers = [];
    let safeFileNameRegex = /[^\w-]/g;

    file.on('limit', () => {
      if (options.abortOnLimit) {
        res.writeHead(413, {'Connection': 'close'});
        res.end('File size limit has been reached');
      }
    });

    file.on('data', function(data) {
      buffers.push(data);

      if (options.debug) {
        return console.log('Uploading %s -> %s', fieldname, filename);
      }
    });

    file.on('end', function() {
      if (!req.files) {
        req.files = {};
      }

      let buf = Buffer.concat(buffers);
      // see: https://github.com/richardgirges/express-fileupload/issues/14
      // firefox uploads empty file in case of cache miss when f5ing page.
      // resulting in unexpected behavior. if there is no file data, the file is invalid.
      if (!buf.length) {
        return;
      }

      if (options.safeFileNames) {
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

            if (extension.length > maxExtensionLength && maxExtensionLength > 0) {
              filenameParts[filenameParts.length - 1] +=
                '.' + extension.substr(0, extension.length - maxExtensionLength);
              extension = extension.substr(-maxExtensionLength);
            }

            extension = maxExtensionLength ? '.' + extension.replace(safeFileNameRegex, '') : '';
            filename = filenameParts.join('.');
          }
        }

        filename = filename.replace(safeFileNameRegex, '').concat(extension);
      }

      const newFile = fileFactory({
        name: filename,
        buffer: buf,
        encoding: encoding,
        truncated: file.truncated,
        mimetype: mime
      });

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

    file.on('error', next);
  };


  // uses a temp-file stream to write data. Better at handling large files without blowing up memory
  let tempFileHandler = function(fieldname, file, filename, encoding, mime) {
    let dir = options.tempFileDir || '/tmp/';

    let tempFilePath = dir + 'tempFile' + Math.random()+'.'+Date.now();

    let lastDataChunkTime = Date.now();

    // check for stalled out file uploads every 10 seconds
    let timeoutInterval = setInterval(function() {
      if (Date.now() - lastDataChunkTime > timeoutThreshhold) {
        file.emit('error', new Error('File upload stalled out'));
      }
    }, 10000);


    if (options.debug) {
      console.log(`Creating write stream via temp file ${tempFilePath}`);
    }

    let writeStream = fs.createWriteStream(tempFilePath);

    let fileSize = 0;

    let safeFileNameRegex = /[^\w-]/g;

    file.on('limit', () => {
      if (options.abortOnLimit) {
        res.writeHead(413, {'Connection': 'close'});
        res.end('File size limit has been reached');
      }
    });

    file.on('data', function(data) {
      writeStream.write(data);
      lastDataChunkTime = Date.now();
      fileSize += data.length;
      if (options.debug) {
        return console.log(`Uploaded ${data.length} bytes for`, fieldname, filename);
      }
    });

    file.on('end', function() {
      if (!req.files) {
        req.files = {};
      }

      writeStream.end();
      clearInterval(timeoutInterval);

      // see: https://github.com/richardgirges/express-fileupload/issues/14
      // firefox uploads empty file in case of cache miss when f5ing page.
      // resulting in unexpected behavior. if there is no file data, the file is invalid.

      if (options.safeFileNames) {
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

            if (extension.length > maxExtensionLength && maxExtensionLength > 0) {
              filenameParts[filenameParts.length - 1] +=
                '.' + extension.substr(0, extension.length - maxExtensionLength);
              extension = extension.substr(-maxExtensionLength);
            }

            extension = maxExtensionLength ? '.' + extension.replace(safeFileNameRegex, '') : '';
            filename = filenameParts.join('.');
          }
        }

        filename = filename.replace(safeFileNameRegex, '').concat(extension);
      }

      const newFile = fileFactory({
        name: filename,
        buffer: null,
        tempFilePath: tempFilePath,
        size: fileSize,
        encoding: encoding,
        truncated: file.truncated,
        mimetype: mime
      });

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

    file.on('error', next);

    file.on('error', function(er) {
      // clean up write stream in case of error
      clearInterval(timeoutInterval);
      writeStream.end();
      fs.unlink(tempFilePath, function(er) {});
    });
  };

  // Build req.files fields

  if (options.useTempFiles) {
    busboy.on('file', tempFileHandler);
  } else {
    busboy.on('file', memoryUploadHandler);
  }

  busboy.on('finish', next);

  busboy.on('error', next);


  req.pipe(busboy);
}

// Methods below were copied from, or heavily inspired by the Connect and connect-busboy packages

/**
 * Ensures the request is not using a non-compliant multipart method
 * such as GET or HEAD
 * @param  {Object}  req Express req object
 * @return {Boolean}
 */
function hasAcceptableMethod(req) {
  return (UNACCEPTABLE_METHODS.indexOf(req.method) < 0);
}

/**
 * Ensures that only multipart requests are processed by express-fileupload
 * @param  {Object}  req Express req object
 * @return {Boolean}
 */
function hasAcceptableMime(req) {
  let str = (req.headers['content-type'] || '').split(';')[0];

  return ACCEPTABLE_MIME.test(str);
}

/**
 * Ensures the request contains a content body
 * @param  {Object}  req Express req object
 * @return {Boolean}
 */
function hasBody(req) {
  return ('transfer-encoding' in req.headers) ||
    ('content-length' in req.headers && req.headers['content-length'] !== '0');
}
