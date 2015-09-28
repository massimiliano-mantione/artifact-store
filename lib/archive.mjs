#external module

var
  Promise = require 'any-promise'
  ; Should fix this for Windows
  ; path-delimiter = (require 'path').delimiter
  path-delimiter = '/'
  hash = require './hash'

var executable? = stats ->
  ! ! (1 & parseInt ((stats.mode & parseInt ("777", 8)).toString (8)[0]))

var process-file = (repo, name, kind, path, fs) -> new Promise
  (resolve, reject) -> do!
    var result = null
    hash(fs.create-read-stream path) |:
      .then #->
        result = {
          kind: kind
          hash: #it
          name: name
        }
        repo.write-file (#it, path)
      .then #->
        resolve result
      .catch #-> reject #it

var process-dir = (repo, name, dir, fs) -> new Promise
  (resolve, reject) -> do!
    fs.readdir
      dir
      (error, entries) -> do!
        if (error)
          reject error
          return
        var
          entry-results = []
          errors = false
        entries.for-each #-> do!
          var entry-path = dir + path-delimiter + #it
          var stat = fs.stat-sync (entry-path)
          if (stat.file?())
            entry-results.push process-file
              repo
              #it
              if (executable? stat) 'x' else 'f'
              entry-path
              fs
          else if (stat.directory?())
            entry-results.push process-dir (repo, #it, entry-path, fs)
          else
            errors = true
            reject ("Cannot process '" + entry-path + "'")
        if (! errors)
          var result = null
          Promise.all(entry-results) |:
            .then
              computed ->
                var dir-data = computed |:
                  .map #->
                    #it.kind + ':' + #it.hash + ':' + #it.name
                  .sort()
                  .join '/'
                var dir-hash = hash.sync dir-data
                result = {
                  kind: 'd'
                  hash: dir-hash
                  name: name
                }
                repo.write (dir-hash, dir-data)
            .then #->
              resolve result
            .catch #-> reject #it

var archive = (repo, dir, fs) -> new Promise
  (resolve, reject) -> do!
    if (fs == undefined)
      fs = require 'fs'
    process-dir (repo, null, dir, fs) |:
      .then #-> resolve #it.hash
      .catch #-> reject #it

module.exports = archive
