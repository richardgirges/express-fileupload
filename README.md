# express-fileupload
Simple express middleware for uploading files.

[![npm](https://img.shields.io/npm/v/express-fileupload.svg)](https://www.npmjs.org/package/express-fileupload)
[![Build Status](https://travis-ci.org/richardgirges/express-fileupload.svg?branch=master)](https://travis-ci.org/richardgirges/express-fileupload)
[![downloads per month](http://img.shields.io/npm/dm/express-fileupload.svg)](https://www.npmjs.org/package/express-fileupload)
[![Coverage Status](https://img.shields.io/coveralls/richardgirges/express-fileupload.svg)](https://coveralls.io/r/richardgirges/express-fileupload)

# Version 0.2.0 Breaking Changes

#### &raquo; Promise support for `.mv()`
`.mv()` now returns a Promise when `callback` argument is not provided

#### &raquo; No more support for < Node.js v6
No more support for versions of Node older than v6. Use with lower versions of Node at your own risk!

# Install
```bash
# With NPM
npm install --save express-fileupload

# With Yarn
yarn add express-fileupload
```

# Usage
When you upload a file, the file will be accessible from `req.files`.

### Example Scenario
* You're uploading a file called **car.jpg**
* Your input's name field is **foo**: `<input name="foo" type="file" />`
* In your express server request, you can access your uploaded file from `req.files.foo`:
```javascript
app.post('/upload', function(req, res) {
  console.log(req.files.foo); // the uploaded file object
});
```
The **req.files.foo** object will contain the following:
* `req.files.foo.name`: "car.jpg"
* `req.files.foo.mv`: A function to move the file elsewhere on your server
* `req.files.foo.mimetype`: The mimetype of your file
* `req.files.foo.data`: A buffer representation of your file
* `req.files.foo.truncated`: A boolean that represents if the file is over the size limit

### Full Example
**Your node.js code:**
```javascript
const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

// default options
app.use(fileUpload());

app.post('/upload', function(req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('/somewhere/on/your/server/filename.jpg', function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});
```

**Your HTML file upload form:**
```html
<html>
  <body>
    <form ref='uploadForm' 
      id='uploadForm' 
      action='http://localhost:8000/upload' 
      method='post' 
      encType="multipart/form-data">
        <input type="file" name="sampleFile" />
        <input type='submit' value='Upload!' />
    </form>     
  </body>
</html>
```

### Uploading Multiple Files
express-fileupload supports multiple file uploads at the same time.

Let's say you have three files in your form, each of the inputs with the name `my_profile_pic`, `my_pet`, and `my_cover_photo`:
```html
<input type="file" name="my_profile_pic" />
<input type="file" name="my_pet" />
<input type="file" name="my_cover_photo" />
```

These uploaded files would be accessible like so:
```javascript
app.post('/upload', function(req, res) {
  // Uploaded files:
  console.log(req.files.my_profile_pic.name);
  console.log(req.files.my_pet.name);
  console.log(req.files.my_cover_photo.name);
});
```

### Using Busboy Options
Pass in Busboy options directly to the express-fileupload middleware. [Check out the Busboy documentation here.](https://github.com/mscdex/busboy#api)

```javascript
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
```


### Using useTempFile Options
Use temp files instead of memory for managing the upload process.

Please note: md5 hashes will not be generated when using tempFiles

```javascript
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));
```

### Available Options
Pass in non-Busboy options directly to the middleware. These are express-fileupload specific options.

Option | Acceptable&nbsp;Values | Details
--- | --- | ---
safeFileNames | <ul><li><code>false</code>&nbsp;**(default)**</li><li><code>true</code></li><li>regex</li></ul> | Strips characters from the upload's filename. You can use custom regex to determine what to strip. If set to `true`, non-alphanumeric characters _except_ dashes and underscores will be stripped. This option is off by default.<br /><br />**Example #1 (strip slashes from file names):** `app.use(fileUpload({ safeFileNames: /\\/g }))`<br />**Example #2:** `app.use(fileUpload({ safeFileNames: true }))`
preserveExtension | <ul><li><code>false</code>&nbsp;**(default)**</li><li><code>true</code></li><li><code>*Number*</code></li></ul> | Preserves filename extension when using <code>safeFileNames</code> option. If set to <code>true</code>, will default to an extension length of 3. If set to <code>*Number*</code>, this will be the max allowable extension length. If an extension is smaller than the extension length, it remains untouched. If the extension is longer, it is shifted.<br /><br />**Example #1 (true):**<br /><code>app.use(fileUpload({ safeFileNames: true, preserveExtension: true }));</code><br />*myFileName.ext* --> *myFileName.ext*<br /><br />**Example #2 (max extension length 2, extension shifted):**<br /><code>app.use(fileUpload({ safeFileNames: true, preserveExtension: 2 }));</code><br />*myFileName.ext* --> *myFileNamee.xt*
abortOnLimit | <ul><li><code>false</code>&nbsp;**(default)**</li><li><code>true</code></ul> | Returns a HTTP 413 when the file is bigger than the size limit if true. Otherwise, it will add a <code>truncate = true</code> to the resulting file structure.
useTempFiles | <ul><li><code>false</code>&nbsp;**(default)**</li><li><code>true</code></ul> | Will use temporary files at the specified tempDir for managing uploads rather than using buffers in memory. This avoids memory issues when uploading large files.
tempFileDir | <ul><li><code>String</code>&nbsp;**(path)**</li></ul> | Used with the <code>useTempFiles</code> option. Path to the directory where temp files will be stored during the upload process. Add trailing slash.

# Help Wanted
Pull Requests are welcomed!

# Thanks & Credit
[Brian White](https://github.com/mscdex) for his stellar work on the [Busboy Package](https://github.com/mscdex/busboy) and the [connect-busboy Package](https://github.com/mscdex/connect-busboy)
