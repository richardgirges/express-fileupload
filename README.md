# express-fileupload
Simple express middleware for uploading files.

[![npm](https://img.shields.io/npm/v/express-fileupload.svg)](https://www.npmjs.org/package/express-fileupload)
[![Build Status](https://travis-ci.org/richardgirges/express-fileupload.svg?branch=master)](https://travis-ci.org/richardgirges/express-fileupload)
[![downloads per month](http://img.shields.io/npm/dm/express-fileupload.svg)](https://www.npmjs.org/package/express-fileupload)
[![Coverage Status](https://img.shields.io/coveralls/richardgirges/express-fileupload.svg)](https://coveralls.io/r/richardgirges/express-fileupload)

# Version 1.0.0 Breaking Changes
Breaking change to `md5` handling. [Read about it here.](https://github.com/richardgirges/express-fileupload/releases/tag/v1.0.0-alpha.1)

# Install
```bash
# With NPM
npm install --save express-fileupload

# With Yarn
yarn add express-fileupload
```

# Usage
When you upload a file, the file will be accessible from `req.files`.

Example:
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
* `req.files.foo.md5`: A function that returns an MD5 checksum of the uploaded file

### Examples
* [Example Project](https://github.com/richardgirges/express-fileupload/tree/master/example)
* [Basic File Upload](https://github.com/richardgirges/express-fileupload/tree/master/example#basic-file-upload)
* [Multi-File Upload](https://github.com/richardgirges/express-fileupload/tree/master/example#multi-file-upload)

### Using Busboy Options
Pass in Busboy options directly to the express-fileupload middleware. [Check out the Busboy documentation here.](https://github.com/mscdex/busboy#api)

```javascript
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
```

### Available Options
Pass in non-Busboy options directly to the middleware. These are express-fileupload specific options.

Option | Acceptable&nbsp;Values | Details
--- | --- | ---
createParentPath | <ul><li><code>false</code>&nbsp;**(default)**</li><li><code>true</code></ul> | Automatically creates the directory path specified in `.mv(filePathName)`
safeFileNames | <ul><li><code>false</code>&nbsp;**(default)**</li><li><code>true</code></li><li>regex</li></ul> | Strips characters from the upload's filename. You can use custom regex to determine what to strip. If set to `true`, non-alphanumeric characters _except_ dashes and underscores will be stripped. This option is off by default.<br /><br />**Example #1 (strip slashes from file names):** `app.use(fileUpload({ safeFileNames: /\\/g }))`<br />**Example #2:** `app.use(fileUpload({ safeFileNames: true }))`
preserveExtension | <ul><li><code>false</code>&nbsp;**(default)**</li><li><code>true</code></li><li><code>*Number*</code></li></ul> | Preserves filename extension when using <code>safeFileNames</code> option. If set to <code>true</code>, will default to an extension length of 3. If set to <code>*Number*</code>, this will be the max allowable extension length. If an extension is smaller than the extension length, it remains untouched. If the extension is longer, it is shifted.<br /><br />**Example #1 (true):**<br /><code>app.use(fileUpload({ safeFileNames: true, preserveExtension: true }));</code><br />*myFileName.ext* --> *myFileName.ext*<br /><br />**Example #2 (max extension length 2, extension shifted):**<br /><code>app.use(fileUpload({ safeFileNames: true, preserveExtension: 2 }));</code><br />*myFileName.ext* --> *myFileNamee.xt*
abortOnLimit | <ul><li><code>false</code>&nbsp;**(default)**</li><li><code>true</code></ul> | Returns a HTTP 413 when the file is bigger than the size limit if true. Otherwise, it will add a <code>truncate = true</code> to the resulting file structure.

# Help Wanted
Pull Requests are welcomed!

# Thanks & Credit
[Brian White](https://github.com/mscdex) for his stellar work on the [Busboy Package](https://github.com/mscdex/busboy) and the [connect-busboy Package](https://github.com/mscdex/connect-busboy)
