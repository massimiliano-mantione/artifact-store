#external module

var
  Promise = require 'any-promise'
  ; Should fix this for Windows
  ; path-delimiter = (require 'path').delimiter
  path-delimiter = '/'
  hash = require './hash'
  commands = require './commands'

var process-file = (repo, hash, path, exe?, fs) -> new Promise
  (resolve, reject) -> do!
    var file = repo.file hash
    var done = false
    if (file != null)
      ; Attempt hard linking
      try
        fs.link-sync (file, path)
        done = true
        resolve true
      catch (var link-error)
        done = false
    if (! done)
      var data = repo.read hash
      var mode = if (exe?) 0755 else 0644
      var destination = fs.create-write-stream (path, {mode: mode})
      data.pipe destination
      destination.on
        'finish'
        #-> resolve true
      destination.on
        'error'
        #-> reject #it

var process-dir = (repo, hash, path, fs) -> new Promise
  (resolve, reject) -> do!
    fs.mkdir-sync (path, 16877)
    commands.read-text(repo, hash) |:
      .then #->
        var entries = commands.parse-dir-data(#it).map #->
          var
            entry = #it
            entry-path = path + path-delimiter + entry.name
          if (entry.kind == 'f')
            process-file (repo, entry.hash, entry-path, false, fs)
          else if (entry.kind == 'x')
            process-file (repo, entry.hash, entry-path, true, fs)
          else if (entry.kind == 'd')
            process-dir (repo, entry.hash, entry-path, fs)
          else Promise.reject
            "Cannot process '" + entry-path + "' of kind '" + entry.kind + "'"
        Promise.all(entries) |:
          .then #-> (resolve true)
          .catch #-> reject #it
      .catch #-> reject #it

var checkout = (repo, dir, tag, fs) ->
  if (fs == undefined)
    fs = require 'fs'
  var
    tag-key = hash.apply-kind('t', tag)
    tag-hash = null
  commands.read-text(repo, tag-key) |:
    .then #->
      if (#it == null)
        Promise.reject('Cannot find tag ', tag)
      else
        tag-hash = #it
      process-dir (repo, tag-hash, dir, fs)

module.exports = checkout
