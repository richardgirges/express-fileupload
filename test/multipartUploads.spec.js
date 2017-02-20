'use strict';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const server = require('./server');
const app = server.app;
const clearUploadsDir = server.clearUploadsDir;
const fileDir = server.fileDir;
const uploadDir = server.uploadDir;

const mockFiles = [
  'car.png',
  'tree.png',
  'basketball.png'
];

let mockUser = {
  firstName: 'Joe',
  lastName: 'Schmo',
  email: 'joe@mailinator.com'
};

describe('Test Directory Cleaning Method', function() {
  it('emptied "uploads" directory', function(done) {
    clearUploadsDir();

    let filesFound = fs.readdirSync(uploadDir).length;

    done(filesFound ? `Directory not empty. Found ${filesFound} files.` : null);
  });
});

describe('Test Single File Upload', function() {
  for (let i = 0; i < mockFiles.length; i++) {
    let fileName = mockFiles[i];

    it(`upload ${fileName} with POST`, function(done) {
      let filePath = path.join(fileDir, fileName);
      let uploadedFilePath = path.join(uploadDir, fileName);

      clearUploadsDir();

      request(app)
        .post('/upload/single')
        .attach('testFile', filePath)
        .expect(200)
        .end(function(err, res) {
          if (err)
            return done(err);

          fs.stat(uploadedFilePath, done);
        });
    });

    it(`upload ${fileName} with PUT`, function(done) {
      let filePath = path.join(fileDir, fileName);
      let uploadedFilePath = path.join(uploadDir, fileName);

      clearUploadsDir();

      request(app)
        .post('/upload/single')
        .attach('testFile', filePath)
        .expect(200)
        .end(function(err, res) {
          if (err)
            return done(err);

          fs.stat(uploadedFilePath, done);
        });
    });
  }

  it('fail when no files were attached', function(done) {
    request(app)
      .post('/upload/single')
      .expect(400)
      .end(done);
  });

  it('fail when using GET', function(done) {
    let filePath = path.join(fileDir, mockFiles[0]);

    request(app)
      .get('/upload/single')
      .attach('testFile', filePath)
      .expect(400)
      .end(done);
  });

  it('fail when using HEAD', function(done) {
    let filePath = path.join(fileDir, mockFiles[0]);

    request(app)
      .head('/upload/single')
      .attach('testFile', filePath)
      .expect(400)
      .end(done);
  });
});

describe('Test Multi-File Upload', function() {
  it('upload multiple files with POST', function(done) {
    let upload1 = path.join(fileDir, mockFiles[0]);
    let upload2 = path.join(fileDir, mockFiles[1]);
    let upload3 = path.join(fileDir, mockFiles[2]);

    clearUploadsDir();

    request(app)
      .post('/upload/multiple')
      .attach('testFile1', upload1)
      .attach('testFile2', upload2)
      .attach('testFile3', upload3)
      .expect(200)
      .end(function(err, res) {
        if (err)
          return done(err);

        fs.stat(upload1, function(err) {
          if (err)
            return done(err);

          fs.stat(upload2, function(err) {
            if (err)
              return done(err);

            fs.stat(upload3, done);
          });
        });
      });
  });
});

describe('Test File Array Upload', function() {
  it('upload array of files with POST', function(done) {
    let req = request(app).post('/upload/array');

    clearUploadsDir();

    for (let i = 0; i < mockFiles.length; i++) {
      req.attach('testFiles', path.join(fileDir, mockFiles[i]));
    }

    req
      .expect(200)
      .end(function(err, res) {
        if (err)
          return done(err);

        for (let i = 0; i < mockFiles.length; i++) {
          fs.statSync(path.join(uploadDir, mockFiles[i]));
        }

        done();
      });
  });
});

describe('Test Upload With Fields', function() {
  for (let i = 0; i < mockFiles.length; i++) {
    let fileName = mockFiles[i];

    it(`upload ${fileName} and submit fields at the same time with POST`, function(done) {
      let filePath = path.join(fileDir, fileName);
      let uploadedFilePath = path.join(uploadDir, fileName);

      clearUploadsDir();

      request(app)
        .post('/upload/single/withfields')
        .attach('testFile', filePath)
        .field('firstName', mockUser.firstName)
        .field('lastName', mockUser.lastName)
        .field('email', mockUser.email)
        .expect(200, {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email
        },
        function(err, res) {
          if (err)
            return done(err);

          fs.stat(uploadedFilePath, done);
        });
    });

    it(`upload ${fileName} and submit fields at the same time with PUT`, function(done) {
      let filePath = path.join(fileDir, fileName);
      let uploadedFilePath = path.join(uploadDir, fileName);

      clearUploadsDir();

      request(app)
        .put('/upload/single/withfields')
        .attach('testFile', filePath)
        .field('firstName', mockUser.firstName)
        .field('lastName', mockUser.lastName)
        .field('email', mockUser.email)
        .expect(200, {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email
        },
        function(err, res) {
          if (err)
            return done(err);

          fs.stat(uploadedFilePath, done);
        });
    });
  }
});
