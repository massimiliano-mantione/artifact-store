#external module

var Promise = require 'any-promise'

var trim = (source, target) -> new Promise
  (resolve, reject) -> do!
    var result = target.for-each
      hash ->
        source.check(hash) |:
          .then #->
            if #it
              Promise.resolve()
            else
              target.remove hash
          .catch #-> Promise.reject #it
    result |:
      .then #-> resolve()
      .catch #-> reject #it

module.exports = trim
