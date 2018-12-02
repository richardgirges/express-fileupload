const fs = require('fs');
let writeStream;
let tempFilePath;

module.exports.getTempFilePath = function() {
  return tempFilePath;
};

module.exports.cleanupStream = function() {
  writeStream.end();

  fs.unlink(tempFilePath, function(err) {
    if (err) throw err;
  });
};

module.exports.complete = function(){
  writeStream.end();
};

module.exports.tempFileHandler = function(options, fieldname, filename) {
  const dir = __dirname + (options.tempFileDir || '/tmp/');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  tempFilePath = dir + 'tmp' + Date.now();
  writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return function(data) {
    writeStream.write(data);
    fileSize += data.length;
    if (options.debug) {
      return console.log( // eslint-disable-line
        `Uploaded ${data.length} bytes for `,
        fieldname,
        filename
      ); 
    }
  };
};
