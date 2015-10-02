#external (module, Buffer)

var
  Promise = require 'any-promise'
  knox = require 'knox'
  KnoxMpu = require 'knox-mpu'
  S3-lister = require 's3-lister'
  stream-buffers = require 'stream-buffers'

var utils = {}

utils.use-mpu = true

utils.s3 = options ->
  knox.create-client options

utils.upload-buffer = (s3, key, buf) -> new Promise
  (resolve, reject) ->
    var req = s3.put(key, {'Content-Length': buf.length})
    req.on
      'response'
      #->
        if (#it.status-code != 200) reject('PUT response for key "' + key + '": ' + #it.status-code)
        else resolve true
    req.on
      'error'
      #-> reject #it
    req.end buf

utils.upload-string = (s3, key, value) ->
  utils.upload-buffer(s3, key, new Buffer(value, 'utf8'))

utils.upload-stream = (s3, key, stream) -> new Promise
  (resolve, reject) -> do!
    if (utils.use-mpu)
      var uploader = new KnoxMpu
        {
          client: s3
          object-name: key
          stream: stream
          no-disk: true
        }
        #->
          if (#it) reject #it
          else resolve()
    else
      var buffer-stream = new stream-buffers.WritableStreamBuffer()
      stream.pipe(buffer-stream)
      stream |:
        .on
          'end'
          #-> utils.upload-buffer(s3, key, buffer-stream.getContents()) |:
            .then #-> resolve true
            .catch #-> reject #it
        .on
          'error'
          #-> reject #it

utils.read-stream = (s3, key) -> new Promise
  (resolve, reject) ->
    var req = s3.get key
    req.on
      'response'
      #->
        if (#it.status-code != 200) resolve null
        else resolve #it
    req.on
      'error'
      #-> reject #it
    req.end()

utils.check = (s3, key) -> new Promise
  (resolve, reject) -> do!
    var req = s3.head key
    req.on
      'response'
      #->
        if (#it.status-code == 200) resolve true
        else resolve false
    req.end()

utils.delete = (s3, key) -> new Promise
  (resolve, reject) -> do!
    var req = s3.del key
    req.on
      'response'
      #->
        if (#it.status-code == 200 || #it.status-code == 204) resolve()
        else reject('DELETE response for key "' + key + '": ' + #it.status-code)
    req.end()


utils.for-each = (s3, cb) -> new Promise
  (resolve, reject) ->
    var
      lister = new S3Lister s3
      errors = false
    lister.on
      'data'
      #-> do!
        if (! errors) cb #it.Key
    lister.on
      'error'
      #-> do!
        errors = true
        reject #it
    lister.on
      'end'
      #-> resolve #it


module.exports = utils
