#external module

var Promise = require 'any-promise'

var copy = (source, target, fs) -> new Promise
  (resolve, reject) -> do!
    if (fs == undefined)
      fs = require 'fs'
    var result = source.for-each
      hash ->
        target.check(hash) |:
          .then #->
            if #it
              Promise.resolve()
            else do
              var source-file = source.file hash
              if (source-file != null) do
                target.write-file (hash, source-file)
              else
                target.write (hash, source.read hash)
          .catch #-> Promise.reject #it
    result |:
      .then #-> resolve()
      .catch #-> reject #it

module.exports = copy
