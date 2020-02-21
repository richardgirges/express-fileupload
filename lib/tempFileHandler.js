const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  debugLog,
  checkAndMakeDir,
  getTempFilename,
  deleteFile
} = require('./utilities');

module.exports = (options, fieldname, filename) => {
  const dir = path.normalize(options.tempFileDir);
  const tempFilePath = path.join(dir, getTempFilename());
  checkAndMakeDir({createParentPath: true}, tempFilePath);

  debugLog(options, `Temporary file path is ${tempFilePath}`);
 
  const hash = crypto.createHash('md5');
  const writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line
  const promise = new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      resolve();
    });
    writeStream.on('error', (err) => {
      debugLog(options, `Error write temp file error:${err}`);
      reject(err);
    });
  });

  return {
    dataHandler: (data) => {
      writeStream.write(data);
      hash.update(data);
      fileSize += data.length;
      debugLog(options, `Uploading ${fieldname}->${filename}, bytes:${fileSize}...`);
    },
    getFilePath: () => tempFilePath,
    getFileSize: () => fileSize,
    getHash: () => hash.digest('hex'),
    complete: () => {
      writeStream.end();
      // Return empty buff since data was uploaded into a temp file.
      return Buffer.concat([]);
    },
    cleanup: () => {
      debugLog(options, `Cleaning up temporary file ${tempFilePath}...`);
      writeStream.end();
      deleteFile(tempFilePath, (err) => { if (err) throw err; });
    },
    getWritePromise: () => {
      return promise;
    }
  };
};
