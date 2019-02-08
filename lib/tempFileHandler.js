const fs = require('fs');
const path = require('path');

module.exports.tempFileHandler = function(options, fieldname, filename) {
  const dir = path.normalize(options.tempFileDir || process.cwd() + '/tmp/');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  let tempFilePath = path.join(dir, 'tmp' + Date.now());
  let writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return {
    handler: function(data) {
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
    getTempFilePath: function(){
      return tempFilePath;
    },
    cleanupStream: function(){
      writeStream.end();

      fs.unlink(tempFilePath, function(err) {
        if (err) throw err;
      });
    },
    complete: function(){
      writeStream.end();
    }
  };
};
