'use strict';

const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const assert = require('assert');
const server = require('./server');
const {isFunc} = require('../lib/utilities');
const fileFactory = require('../lib/fileFactory');

const mockFileName = 'basketball.png';
const mockFile = path.join(server.fileDir, mockFileName);
const mockBuffer = fs.readFileSync(mockFile);
const mockMd5 = md5(mockBuffer);

const mockFileOpts = {
  name: mockFileName,
  buffer: mockBuffer,
  encoding: 'utf-8',
  mimetype: 'image/png',
  hash: mockMd5,
  tempFilePath: mockFile
};

describe('fileFactory: Test of the fileFactory factory', function() {
  beforeEach(() => server.clearUploadsDir());

  it('return a file object', () => assert.ok(fileFactory(mockFileOpts)));

  describe('Properties', function() {
    it('contains the name property', () => {
      assert.equal(fileFactory(mockFileOpts).name, mockFileName);
    });
    it('contains the data property', () => assert.ok(fileFactory(mockFileOpts).data));
    it('contains the encoding property', () => {
      assert.equal(fileFactory(mockFileOpts).encoding, 'utf-8');
    });
    it('contains the mimetype property', () => {
      assert.equal(fileFactory(mockFileOpts).mimetype, 'image/png');
    });
    it('contains the md5 property', () => assert.equal(fileFactory(mockFileOpts).md5, mockMd5));
    it('contains the mv method', () => assert.equal(isFunc(fileFactory(mockFileOpts).mv), true));
  });

  describe('File object behavior for in memory upload', function() {
    const file = fileFactory(mockFileOpts);
    it('move the file to the specified folder', (done) => {
      file.mv(path.join(server.uploadDir, mockFileName), (err) => {
        assert.ifError(err);
        done();
      });
    });
    it('reject the mv if the destination does not exists', (done) => {
      file.mv(path.join(server.uploadDir, 'unknown', mockFileName), (err) => {
        assert.ok(err);
        done();
      });
    });
  });

  describe('File object behavior for upload into temporary file', function() {
    const file = fileFactory(mockFileOpts, { useTempFiles: true });
    it('move the file to the specified folder', (done) => {
      file.mv(path.join(server.uploadDir, mockFileName), (err) => {
        assert.ifError(err);
        // Place back moved file.
        fs.renameSync(path.join(server.uploadDir, mockFileName), mockFile);
        done();
      });
    });
    it('reject the mv if the destination does not exists', (done) => {
      file.mv(path.join(server.uploadDir, 'unknown', mockFileName), (err) => {
        assert.ok(err);
        done();
      });
    });
  });

  [false, true].forEach((useTempFiles) => {
    describe(`Path validation with useTempFiles=${useTempFiles}`, function() {
      const destination = path.join('nested', mockFileName);
      const savedPath = path.join(server.uploadDir, destination);
      const escapedPath = path.resolve(server.uploadDir, '../rejected-upload.png');
      const tempFilePath = path.join(server.tempDir, mockFileName);

      beforeEach(() => server.clearTempDir());
      afterEach(() => server.clearTempDir());

      const createFile = () => {
        if (useTempFiles) fs.copyFileSync(mockFile, tempFilePath);
        return fileFactory(Object.assign({}, mockFileOpts, { tempFilePath }), {
          uploadDir: server.uploadDir,
          validatePaths: true,
          createParentPath: true,
          useTempFiles
        });
      };

      const checkRejectedPath = (err) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /Path traversal detected/);
        assert.equal(fs.existsSync(escapedPath), false);
        assert.equal(fs.existsSync(path.dirname(savedPath)), false);
        if (useTempFiles) assert.ok(fs.existsSync(tempFilePath));
      };

      const checkSavedFile = () => {
        assert.deepEqual(fs.readFileSync(savedPath), mockBuffer);
        if (useTempFiles) assert.equal(fs.existsSync(tempFilePath), false);
      };

      it('Returns validation errors to callbacks and allows a safe retry', (done) => {
        const file = createFile();
        file.mv('../rejected-upload.png', (err) => {
          checkRejectedPath(err);
          file.mv(destination, (moveErr) => {
            assert.ifError(moveErr);
            checkSavedFile();
            done();
          });
        });
      });

      it('Rejects invalid paths through promises and allows a safe retry', () => {
        const file = createFile();
        return file.mv('../rejected-upload.png').then(
          () => assert.fail('Expected path validation to reject the upload'),
          (err) => {
            checkRejectedPath(err);
            return file.mv(destination).then(checkSavedFile);
          }
        );
      });
    });
  });
});
