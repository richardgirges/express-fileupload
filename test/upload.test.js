var express    = require('express'),
	fileUpload = require('../lib/index.js'),
	app        = express();

app.use('/form', express.static(__dirname + '/upload.test.html'));

// default options
app.use(fileUpload());

app.get('/ping', function(req, res) {
	res.send('pong');
});

app.post('/upload', function(req, res) {
	var sampleFile, uploadPath;

	if (!req.files) {
		res.status(400).send('No files were uploaded.');
		return;
	}

	sampleFile = req.files.sampleFile;

	uploadPath = __dirname + '/uploadedfiles/' + sampleFile.name;

	sampleFile.mv(uploadPath, function(err) {
		if (err) {
			res.status(500).send(err);
		}
		else {
			res.send('File uploaded to ' + uploadPath);
		}
	});
});

app.listen(8000, function() {
	console.log('Express server listening on port 8000');
})