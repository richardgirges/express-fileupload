const fs = require('fs');
const path = require('path');
const request = require('supertest');
const server = require('./server');
const clearUploadsDir =
  server.clearUploadsDir;
const fileDir =
  server.fileDir;
const uploadDir =
  server.uploadDir;
describe('File Upload Options Tests', function() {
  afterEach(function(done) {
    clearUploadsDir();
    done();
  });
  /**
   * Upload the file for testing and verify the expected filename.
   * @param {object} options The expressFileUpload options.
   * @param {string} actualFileNameToUpload The name of the file to upload.
   * @param {string} expectedFileNameOnFileSystem The name of the file after upload.
   * @param {function} done The mocha continuation function.
   */
  function executeFileUploadTestWalk(
    options,
    actualFileNameToUpload,
    expectedFileNameOnFileSystem,
    done
  ) {
    request(
      server.setup(options)
    )
      .post('/upload/single')
      .attach(
        'testFile',
        path.join(
          fileDir,
          actualFileNameToUpload
        )
      )
      .expect(200)
      .end(function(err) {
        if (err) {
          return done(err);
        }
        const uploadedFilePath = path.join(
          uploadDir,
          expectedFileNameOnFileSystem
        );
        fs.stat(
          uploadedFilePath,
          done
        );
      });
  }
  describe('Testing [safeFileNames with useTempFiles] option to ensure:', function() {
    it('Does nothing to your filename when disabled.', function(done) {
      const fileUploadOptions = {
        safeFileNames: false,
        useTempFiles: true,
        tempFileDir: '/tmp/'
      };
      const actualFileName =
        'my$Invalid#fileName.png123';
      const expectedFileName =
        'my$Invalid#fileName.png123';
      executeFileUploadTestWalk(
        fileUploadOptions,
        actualFileName,
        expectedFileName,
        done
      );
    });
    it('Is disabled by default.', function(done) {
      const fileUploadOptions = {
        useTempFiles: true,
        tempFileDir: '/tmp/'
      };
      const actualFileName =
        'my$Invalid#fileName.png123';
      const expectedFileName =
        'my$Invalid#fileName.png123';
      executeFileUploadTestWalk(
        fileUploadOptions,
        actualFileName,
        expectedFileName,
        done
      );
    });

    it(
      'Strips away all non-alphanumeric characters (excluding hyphens/underscores) when enabled.', 
      function(done) {
        const fileUploadOptions = {
          safeFileNames: true,
          useTempFiles: true,
          tempFileDir: '/tmp/'
        };
        const actualFileName = 'my$Invalid#fileName.png123';
        const expectedFileName = 'myInvalidfileNamepng123';
        executeFileUploadTestWalk(
          fileUploadOptions,
          actualFileName,
          expectedFileName,
          done
        );
      });

    it(
      'Accepts a regex for stripping (decidedly) "invalid" characters from filename.', 
      function(done) {
        const fileUploadOptions = {
          safeFileNames: /[$#]/g,
          useTempFiles: true,
          tempFileDir: '/tmp/'
        };
        const actualFileName = 'my$Invalid#fileName.png123';
        const expectedFileName = 'myInvalidfileName.png123';
        executeFileUploadTestWalk(
          fileUploadOptions,
          actualFileName,
          expectedFileName,
          done
        );
      });
  });
});
