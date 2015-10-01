#external (module)

var
  Promise = require 'any-promise'
  S3-lister = require 's3-lister'

var utils = {}

utils.read-stream = (s3, key) -> new Promise
  (resolve, reject) ->
    var req = s3.get key
    req.on
      'response'
      #-> do!
        if (#it.status-code != 200) resolve null
        else resolve #it
    req.end()

utils.check = (s3, key) -> new Promise
  (resolve, reject) -> do!
    var req = s3.head key
    req.on
      'response'
      #-> do!
        if (#it.status-code == 200) resolve true
        else resolve false
        ; FIXME: should close it to avoid useless data transfer!
        ; #it.close()
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
