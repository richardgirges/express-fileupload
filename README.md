# express-fileupload
Simple express file upload middleware that wraps around [connect-busboy](https://github.com/mscdex/connect-busboy).

## Install
```bash
npm install express-fileupload
```

## Important Note
Add `app.use(fileUpload())` *AFTER* `app.use(bodyParser.json)` and any other bodyParser middlewares! This limitation will be explored and resolved in an upcoming release.

=======
Pass in Busboy options directly to express-fileupload (using Busboy `v0.2.13`). Check out the Busboy documentation here: https://github.com/mscdex/busboy#api

```javascript
app.use(fileUpload({
	limits: { fileSize: 50 * 1024 * 1024 },
}));
```

## Example

### Node.js:

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

	sampleFile = req.files.sampleFile;
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

### HTML Form:
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

## Thanks & Credit

* [Brian White](https://github.com/mscdex) for his stellar work on the [Busboy Package](https://github.com/mscdex/busboy) and the [connect-busboy Package](https://github.com/mscdex/connect-busboy)
