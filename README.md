# Description
Simple express middleware for uploading files.

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
* `req.files.mimetype`: The mimetype of your file
* `req.files.data`: A buffer representation of your file

### Full Example
**Your node.js code:**
```javascript
var express = require('express');
var fileUpload = require('express-fileupload');
var app = express();

// default options
app.use(fileUpload());

app.post('/upload', function(req, res) {
  var sampleFile;

  if (!req.files) {
    res.send('No files were uploaded.');
    return;
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  sampleFile = req.files.sampleFile;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('/somewhere/on/your/server/filename.jpg', function(err) {
    if (err) {
      res.status(500).send(err);
    }
    else {
      res.send('File uploaded!');
    }
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

### Available Options
Pass in non-Busboy options directly to the middleware. These are express-fileupload specific options.

Option | Acceptable&nbsp;Values | Details
--- | --- | ---
safeFileNames | <ul><li><code>false</code>&nbsp;**(default)**</li><li><code>true</code></li><li>regex</li></ul> | Strips characters from the upload's filename. You can use custom regex to determine what to strip. If set to `true`, non-alphanumeric characters _except_ dashes and underscores will be stripped. This option is off by default.<br /><br />**Example #1 (strip slashes from file names):** `app.use(fileUpload({ safeFileNames: /\\/g }))`<br />**Example #2:** `app.use(fileUpload({ safeFileNames: true }))`

# Known Bugs
##### If you're using bodyParser middleware
Add `app.use(fileUpload())` *AFTER* `app.use(bodyParser.json)` and any other `bodyParser` middlewares! This limitation will be investigated in an upcoming release.

# Help Wanted
Pull Requests are welcomed!

# Thanks & Credit
[Brian White](https://github.com/mscdex) for his stellar work on the [Busboy Package](https://github.com/mscdex/busboy) and the [connect-busboy Package](https://github.com/mscdex/connect-busboy)
