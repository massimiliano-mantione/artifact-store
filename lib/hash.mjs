#external module

var
  Promise = require 'any-promise'
  crypto = require 'crypto'
  ALGORITHM = 'sha1'
  DIGEST-FORMAT = 'hex'

var hash = stream -> new Promise
  (resolve, reject) -> do!
    var shasum = crypto.createHash ALGORITHM
    stream.on
      'data'
      #-> shasum.update #it
    stream.on
      'end'
      #-> resolve (shasum.digest DIGEST-FORMAT)
    stream.on
      'error'
      #-> reject #it

hash.sync = data ->
  if (typeof data == 'string') do
    var shasum = crypto.createHash ALGORITHM
    shasum.update (data, 'utf8')
    shasum.digest DIGEST-FORMAT
  else throw new Error ("Please provide a string")

module.exports = hash
