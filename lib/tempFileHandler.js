const fs = require('fs');
let writeStream;
let tempFilePath;


module.exports.cleanupStream = function() {
  writeStream.end();

  console.log('temp file path in file handler >>.',tempFilePath)
  module.exports.tempFilePath = tempFilePath;
  console.log('data ended and got this file >>>',fs.readFileSync(tempFilePath,'utf8'), tempFilePath);
  fs.unlink(tempFilePath, function(err) {
    if (err) throw err;
  });
};

module.exports.tempFileHandler = function(options, fieldname, filename) {
  const dir = options.tempFileDir || '/tmp/';
  tempFilePath = dir + 'tmp' + Date.now();
  writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return function(data) {
    writeStream.write(data);
    console.log('data starting', 'opening >>>',fs.readFileSync(tempFilePath,'utf8'), tempFilePath);
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
