const fs = require('fs');
const path = require('path');
const request = require('supertest');
const server = require('./server');
// const clearUploadsDir = server.clearUploadsDir;
const fileDir = server.fileDir;
const uploadDir = server.uploadDir;

describe('SafeFileNames', function() {
  it(`Does nothing to your filename when disabled.`, function(done) {
    const app = server.setup({safeFileNames: false});

    request(app)
      .post('/upload/single')
      .attach('testFile', path.join(fileDir, 'my$Invalid#fileName.png123'))
      .expect(200)
      .end(function(err, res) {
        if (err)
          return done(err);

        let uploadedFilePath = path.join(uploadDir, 'my$Invalid#fileName.png123');

        fs.stat(uploadedFilePath, done);
      });
  });

  it(`Strips away all illegal characters (including spaces) when enabled.`, function(done) {
    const app = server.setup({safeFileNames: true});

    request(app)
      .post('/upload/single')
      .attach('testFile', path.join(fileDir, 'my$Invalid#fileName.png123'))
      .expect(200)
      .end(function(err, res) {
        if (err)
          return done(err);

        let uploadedFilePath = path.join(uploadDir, 'myInvalidfileNamepng123');

        fs.stat(uploadedFilePath, done);
      });
  });

  it(`Respects a regex for stripping 'invalid' characters from filename.`, function(done) {
    const app = server.setup({safeFileNames: /[\$#]/g});

    request(app)
      .post('/upload/single')
      .attach('testFile', path.join(fileDir, 'my$Invalid#fileName.png123'))
      .expect(200)
      .end(function(err, res) {
        if (err)
          return done(err);

        let uploadedFilePath = path.join(uploadDir, 'myInvalidfileName.png123');

        fs.stat(uploadedFilePath, done);
      });
  });
});

describe(`preserveExtension`, function() {
  it(`Does nothing to your filename when disabled.`, function(done) {
    const app = server.setup({safeFileNames: true, preserveExtension: false});

    request(app)
      .post('/upload/single')
      .attach('testFile', path.join(fileDir, 'my$Invalid#fileName.png123'))
      .expect(200)
      .end(function(err, res) {
        if (err)
          return done(err);

        let uploadedFilePath = path.join(uploadDir, 'myInvalidfileNamepng123');

        fs.stat(uploadedFilePath, done);
      });
  });

  it(`Shortens your extension to the default(3) when enabled, if the extension found is larger`,
    function(done) {
    const app = server.setup({safeFileNames: true, preserveExtension: true});

    request(app)
      .post('/upload/single')
      .attach('testFile', path.join(fileDir, 'my$Invalid#fileName.png123'))
      .expect(200)
      .end(function(err, res) {
        if (err)
          return done(err);

        let uploadedFilePath = path.join(uploadDir, 'myInvalidfileNamepng.123');

        fs.stat(uploadedFilePath, done);
      });
  });

  it(`Leaves your extension alone when enabled, if the extension found is <= default(3) length`,
    function(done) {
      const app = server.setup({safeFileNames: true, preserveExtension: true});

      request(app)
        .post('/upload/single')
        .attach('testFile', path.join(fileDir, 'car.png'))
        .expect(200)
        .end(function(err, res) {
          if (err)
            return done(err);

          let uploadedFilePath = path.join(uploadDir, 'car.png');

          fs.stat(uploadedFilePath, done);
        });
    });

  it(`Leaves your extension alone when set to a number >= the extension length.`,
    function(done) {
      const app = server.setup({safeFileNames: true, preserveExtension: 7});

      request(app)
        .post('/upload/single')
        .attach('testFile', path.join(fileDir, 'my$Invalid#fileName.png123'))
        .expect(200)
        .end(function(err, res) {
          if (err)
            return done(err);

          let uploadedFilePath = path.join(uploadDir, 'myInvalidfileName.png123');

          fs.stat(uploadedFilePath, done);
        });
    });

  it(`Only considers the last dotted part the extension.`,
    function(done) {
      const app = server.setup({safeFileNames: true, preserveExtension: true});

      request(app)
        .post('/upload/single')
        .attach('testFile', path.join(fileDir, 'basket.ball.bp'))
        .expect(200)
        .end(function(err, res) {
          if (err)
            return done(err);

          let uploadedFilePath = path.join(uploadDir, 'basketball.bp');

          fs.stat(uploadedFilePath, done);
        });
    });
});
