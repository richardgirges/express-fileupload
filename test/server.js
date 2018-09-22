'use strict';

const path = require('path');
const fileDir = path.join(__dirname, 'files');
const uploadDir = path.join(__dirname, 'uploads');
const fs = require('fs');
const rimraf = require('rimraf');

const clearUploadsDir = function() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  } else {
    rimraf.sync(uploadDir);
    fs.mkdirSync(uploadDir);
  }
};

const setup = function(fileUploadOptions) {
  const express = require('express');
  const expressFileupload = require('../lib/index');

  const app = express();

  fileUploadOptions = fileUploadOptions || {};
  app.use(expressFileupload(fileUploadOptions));

  app.all('/upload/single', function(req, res) {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }

    let testFile = req.files.testFile;
    let uploadPath = path.join(uploadDir, testFile.name);

    testFile.mv(uploadPath, function(err) {
      if (err) {
        console.log('ERR', err); // eslint-disable-line
        return res.status(500).send(err);
      }

      res.send('File uploaded to ' + uploadPath);
    });
  });

  app.all('/upload/single/promise', function(req, res) {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }

    let testFile = req.files.testFile;
    let uploadPath = path.join(uploadDir, testFile.name);

    testFile.mv(uploadPath)
      .then(() => {
        res.send('File uploaded to ' + uploadPath);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  app.all('/upload/single/withfields', function(req, res) {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }

    if (!req.body) {
      return res.status(400).send('No request body found');
    }

    if (!req.body.firstName || !req.body.firstName.trim()) {
      return res.status(400).send('Invalid first name');
    }

    if (!req.body.lastName || !req.body.lastName.trim()) {
      return res.status(400).send('Invalid last name');
    }

    if (!req.body.email || !req.body.email.trim()) {
      return res.status(400).send('Invalid email');
    }

    let testFile = req.files.testFile;
    let uploadPath = path.join(uploadDir, testFile.name);

    testFile.mv(uploadPath, function(err) {
      if (err) {
        return res.status(500).send(err);
      }

      res.json({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
      });
    });
  });

  app.all('/upload/single/truncated', function(req, res) {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }

    if (req.files.testFile.truncated) {
      // status 400 to differentiate from ending the request in the on limit
      return res.status(400).send(`File too big`);
    }

    return res.status(200).send('Upload succeed');
  });

  app.all('/upload/multiple', function(req, res) {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }

    let testFile1 = req.files.testFile1;
    let testFile2 = req.files.testFile2;
    let testFile3 = req.files.testFile3;
    let uploadPath1 = path.join(uploadDir, testFile1.name);
    let uploadPath2 = path.join(uploadDir, testFile2.name);
    let uploadPath3 = path.join(uploadDir, testFile3.name);

    if (!testFile1) {
      return res.status(400).send('testFile1 was not uploaded');
    }

    if (!testFile2) {
      return res.status(400).send('testFile2 was not uploaded');
    }

    if (!testFile3) {
      return res.status(400).send('testFile3 was not uploaded');
    }

    testFile1.mv(uploadPath1, function(err) {
      if (err) {
        return res.status(500).send(err);
      }

      testFile2.mv(uploadPath2, function(err) {
        if (err) {
          return res.status(500).send(err);
        }

        testFile3.mv(uploadPath3, function(err) {
          if (err) {
            return res.status(500).send(err);
          }

          res.send('Files uploaded to ' + uploadDir);
        });
      });
    });
  });

  app.all('/upload/array', function(req, res) {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }

    let testFiles = req.files.testFiles;

    if (!testFiles) {
      return res.status(400).send('No files were uploaded');
    }

    if (!Array.isArray(testFiles)) {
      return res.status(400).send('Files were not uploaded as an array');
    }

    if (!testFiles.length) {
      return res.status(400).send('Files array is empty');
    }

    let filesUploaded = 0;
    for (let i = 0; i < testFiles.length; i++) {
      let uploadPath = path.join(uploadDir, testFiles[i].name);

      testFiles[i].mv(uploadPath, function(err) {
        if (err) {
          return res.status(500).send(err);
        }

        if (++filesUploaded === testFiles.length) {
          res.send('File uploaded to ' + uploadPath);
        }
      });
    }
  });

  app.all('/fields/user', function(req, res) {
    if (!req.body) {
      return res.status(400).send('No request body found');
    }

    if (!req.body.firstName || !req.body.firstName.trim()) {
      return res.status(400).send('Invalid first name');
    }

    if (!req.body.lastName || !req.body.lastName.trim()) {
      return res.status(400).send('Invalid last name');
    }

    if (!req.body.email || !req.body.email.trim()) {
      return res.status(400).send('Invalid email');
    }

    res.json({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
    });
  });

  app.all('/fields/array', function(req, res) {
    if (!req.body) {
      return res.status(400).send('No request body found');
    }

    if (!req.body.testField) {
      return res.status(400).send('Invalid field');
    }

    if (!Array.isArray(req.body.testField)) {
      return res.status(400).send('Field is not an array');
    }

    res.json(req.body.testField);
  });

  return app;
};

module.exports = {
  setup,
  fileDir,
  uploadDir,
  clearUploadsDir
};
