express-fileupload
===========
Simple express file upload middleware that wraps around [connect-busboy](https://github.com/mscdex/connect-busboy).


Install
=======

    npm install express-fileupload


Example
=======

### JavaScript

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

### Form
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