#external (module, Buffer)

var
  Promise = require 'any-promise'
  ; Should fix this for Windows
  ; path-delimiter = (require 'path').delimiter
  path-delimiter = '/'

module.exports = (root, fs) ->
  if (fs == undefined) (fs = require 'fs')
  var file-path = (hash) ->
    root + '/' + hash
  var check-hash = hash -> do
    var file = file-path hash
    try do
      var stat = fs.stat-sync file
      if (stat.directory?() || stat.file?())
        true
      else
        false
    catch (var e)
      false
  {
    kind: 'DIR'

    data: root

    check: (hash) -> Promise.resolve (check-hash hash)

    file: (hash) -> file-path hash

    read: (hash) -> Promise.resolve
      if (check-hash hash)
        fs.create-read-stream (this.file hash)
      else null

    write: (hash, data) ->
      new Promise
        (resolve, reject) => do!
          if (check-hash hash)
            resolve false
          else
            var stream = fs.create-write-stream (this.file hash)
            if (typeof data == 'string')
              stream.end data
            else
              ; Assume data is a readable stream
              data.pipe stream
            ; Anyway, signal end of write
            stream.on
              'finish'
              #-> resolve true
            stream.on
              'error'
              #-> reject #it

    write-file: (hash, path) ->
      new Promise
        (resolve, reject) => do!
          if (check-hash hash)
            resolve false
          else
            var resolved = false

            ; Attempt hard linking
            try
              var destination-file = this.file hash
              fs.link-sync (path, destination-file)
              resolved = true
              resolve true
            catch (var link-error)
              ; No real failure, fallback to copying
              resolved = false

            ; Do a plain copy
            if (! resolved)
              var source-stream = fs.create-read-stream path
              if (source-stream != null)
                (this.write source-stream) |:
                  .then #-> resolve true
                  .catch #-> reject #it
              else reject ("Cannot create source stream for " + hash)

    for-each: (callback) ->
      new Promise
        (resolve, reject) => do!
          fs.readdir
            root
            (error, entries) -> do!
              if (error)
                reject error
              else
                var results = entries.map callback
                Promise.all(results) |:
                  .then #-> resolve undefined
                  .catch #-> reject #it

    remove: (hash) ->
      new Promise
        (resolve, reject) => do!
          var file = file-path hash
          fs.unlink
            file
            #->
              if (#it) reject #it
              else resolve()

  }
