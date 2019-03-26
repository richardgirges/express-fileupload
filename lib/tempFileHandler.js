const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  debugLog,
  checkAndMakeDir,
  getTempFilename
} = require('./utilities');

module.exports = (options, fieldname, filename) => {
  const dir = path.normalize(options.tempFileDir || process.cwd() + '/tmp/');
  const tempFilePath = path.join(dir, getTempFilename());
 
  checkAndMakeDir({createParentPath: true}, tempFilePath);

  let hash = crypto.createHash('md5');
  let writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return {
    dataHandler: (data) => {
      writeStream.write(data);
      hash.update(data);
      fileSize += data.length;
      debugLog(options, `Uploading ${fieldname} -> ${filename}, bytes: ${fileSize}`);
    },
    getFilePath: () => tempFilePath,
    getFileSize: () => fileSize,
    getHash: () => hash.digest('hex'),
    complete: () => {
      writeStream.end();
      //return empty buffer since data uploaded to the temporary file.
      return Buffer.concat([]);
    },
    cleanup: () => {
      writeStream.end();
      fs.unlink(tempFilePath, (err) => {
        if (err) throw err;
      });
    }
  };
};
