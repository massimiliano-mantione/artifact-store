#external (module, Buffer)

var
  Promise = require 'any-promise'
  ; Should fix this for Windows
  ; path-delimiter = (require 'path').delimiter
  path-delimiter = '/'
  s3-utils = require './s3-utils'

module.exports = (options, fs) ->
  if (fs == undefined) (fs = require 'fs')
  var s3 = s3-utils.s3 options
  {
    kind: 'S3'

    data: s3

    check: (hash) -> s3-utils.check(s3, hash)

    file: (hash) -> null

    read: (hash) -> s3-utils.read-stream(s3, hash)

    write: (hash, data) ->
      s3-utils.check(s3, hash).then #->
        if (#it) Promise.resolve false
        else
          if (typeof data == 'string')
            s3-utils.upload-string(s3, hash, data)
          else
            ; Assume data is a readable stream
            s3-utils.upload-stream(s3, hash, data)

    write-file: (hash, path, use-links) ->
      s3-utils.check(s3, hash).then #->
        if (#it)
          Promise.resolve false
        else
          s3-utils.upload-stream(s3, hash, fs.create-read-stream path)

    for-each: (callback) ->
      var results = []
      |:
        s3-utils.for-each
          s3
          #-> results.push
            Promise.resolve(callback #it)
        .then #->
          Promise.all results

    remove: (hash) ->
      s3-utils.delete(s3, hash)
  }
