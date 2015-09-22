#external module

var
  Promise = require 'any-promise'
  ; Should fix this for Windows
  ; path-delimiter = (require 'path').delimiter
  path-delimiter = '/'
  commands = require './commands'

var process-entry;
var process-dir = (source, target, hash) ->
  commands.read-text(source, hash) |:
    .then #-> Promise.all
      (commands.parse-dir-data #it).map #->
        process-entry
          source
          target
          #it.hash
          if (#it.kind == 'd') true else false
    .catch #-> Promise.reject #it

process-entry = (source, target, hash, dir?) -> new Promise
  (resolve, reject) -> do!
    target.check(hash).then #-> do!
      if (#it)
        resolve false
      else
        var todo = [target.write (hash, source.read hash)]
        if (dir?)
          todo.push (process-dir (source, target, hash))
        Promise.all(todo) |:
          .then #-> resolve true
          .catch #-> reject #it

var pull = (source, target, hash) ->
  process-entry (source, target, hash, true)

module.exports = pull
