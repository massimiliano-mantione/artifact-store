#external (module, Buffer)

var Promise = require 'any-promise'

module.exports = (root, fs) -> do
  if (fs == undefined)
    fs = require 'fs'
  {
    kind: 'DIR'

    data: root

    check: (hash) -> do
      var file = this.file hash
      try do
        var stat = fs.stat-sync file
        if (stat.directory?() || stat.file?())
          true
        else
          false
      catch (var e)
        false

    file: (hash) ->
      this.data + '/' + hash

    read: (hash) ->
      if (this.check hash)
        fs.create-read-stream (this.file hash)
      else null

    write: (hash, data) ->
      new Promise
        (resolve, reject) => do!
          if (this.check hash)
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
          if (this.check hash)
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
                (this.write source-stream).then #->
                  resolve true
              else reject ("Cannot create source stream for " + hash)
  }
