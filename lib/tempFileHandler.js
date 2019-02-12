const fs = require('fs');
const path = require('path');

module.exports = function(options, fieldname, filename) {
  const dir = path.normalize(options.tempFileDir || process.cwd() + '/tmp/');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  let tempFilePath = path.join(dir, 'tmp' + Date.now());
  let writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return {
    dataHandler: function(data) {
      writeStream.write(data);
      fileSize += data.length;
      if (options.debug) {
        return console.log( // eslint-disable-line
          `Uploaded ${data.length} bytes for `,
          fieldname,
          filename
        );
      }
    },
    getFilePath: function(){
      return tempFilePath;
    },
    getFileSize: function(){
      return fileSize;
    },
    cleanup: function(){
      writeStream.end();

      fs.unlink(tempFilePath, function(err) {
        if (err) throw err;
      });
    },
    complete: function(){
      writeStream.end();
      return Buffer.concat([]); //return empty buffer since uploaded to the temporary file.
    }
  };
};
