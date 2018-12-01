const fs = require("fs");
let writeStream;
let tempFilePath;

module.exports.cleanupStream = function() {
  writeStream.end();
  fs.unlink(tempFilePath, function(err) {
    if (err) throw err;
  });
};

module.exports.tempFileHandler = function(options, fieldname, filename) {
  const dir = options.tempFileDir || "/tmp/";
  tempFilePath = dir + "tmp" + Date.now();
  writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0;

  return function(data) {
    writeStream.write(data);
    fileSize += data.length;
    if (options.debug) {
      return console.log(
        `Uploaded ${data.length} bytes for `,
        fieldname,
        filename
      );
    }
  };
};
