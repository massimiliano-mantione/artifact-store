#external (Buffer, module)

var
  Promise = require 'any-promise'
  S3rver = require 's3rver'

var headers = {'content-type': 'text-plain'}

var init-bucket = #-> new Promise
  (resolve, reject) -> do!
    var
      fknox = #it.client
      objects = #it.objects
    |:
      fknox.delete-bucket(#next)
      #->
        fknox.create-bucket(#next)
      #-> do!
        if (#it) reject #it
        else
          var
            keys = Object.keys objects
            results = keys.map #->
              var key = #it
              new Promise
                (res, rej) -> fknox.put-buffer
                  new Buffer (objects[key])
                  #it
                  headers
                  #->
                    if (#it) rej #it
                    else res()
          Promise.all(results) |:
            .then #-> resolve()
            .catch #-> reject #it

init-bucket.run-server =
  (config, cb) ->
    var
      fs = require 'fs'
      mkdirp = require 'mkdirp'
      rimraf = require 'rimraf'
    rimraf.sync config.directory
    mkdirp.sync config.directory
    (new S3rver(config)).run
      (err, host, port) -> do!
        if (err) cb err
        else cb()

module.exports = init-bucket
