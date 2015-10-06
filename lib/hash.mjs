#external module

var
  Promise = require 'any-promise'
  crypto = require 'crypto'
  ALGORITHM = 'sha1'
  DIGEST-FORMAT = 'hex'

var kinds = {
  'f': 'F'
  'F': 'F'
  'd': 'D'
  'D': 'D'
  't': 'T'
  'T': 'T'
}
var check-kind = kind ->
  typeof (kinds[kind]) == 'string'
var apply-kind = (kind, value) ->
  kinds[kind] + '-' + value

var hash = (stream, kind) ->
  if (check-kind kind)
    new Promise (resolve, reject) -> do!
      var shasum = crypto.createHash ALGORITHM
      stream.on
        'data'
        #-> shasum.update #it
      stream.on
        'end'
        #-> resolve (apply-kind (kind, shasum.digest DIGEST-FORMAT))
      stream.on
        'error'
        #-> reject #it
  else Promise.reject("Unsupported kind " + kind)

hash.sync = (data, kind) ->
  if (typeof data == 'string') do
    if (! check-kind kind)
      throw new Error ("Unsupported kind " + kind)
    var shasum = crypto.createHash ALGORITHM
    shasum.update (data, 'utf8')
    apply-kind(kind, shasum.digest DIGEST-FORMAT)
  else throw new Error ("Please provide a string")

hash.check-kind = check-kind
hash.apply-kind = apply-kind

module.exports = hash
