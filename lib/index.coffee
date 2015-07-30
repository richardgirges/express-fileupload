busboy 	= require 'connect-busboy'
fs 		= require 'fs-extra'

module.exports = (options) ->
	options = options or {}

	return (req, res, next) ->
		busboy(options)(req, res, ->
			if !req.busboy
				return next()

			req.files = null

			req.busboy.on 'file', (fieldname, file, filename, encoding, mimetype) ->
				file.on 'data', (data) ->
					if options.debug
						console.log 'Uploading %s -> %s', fieldname, filename

				file.on 'end', ->
					if !req.files then req.files = {}

					req.files[fieldname] =
						name: filename,
						data: file
						encoding: encoding
						mimetype: mimetype
						mv: (path, callback) ->
							fstream = fs.createWriteStream path
							@data.pipe fstream
							fstream.on 'error', (error) ->
								callback error
							fstream.on 'close', ->
								callback null

			req.busboy.on 'finish', next

			req.pipe req.busboy
	)