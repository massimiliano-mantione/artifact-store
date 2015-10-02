#external module

var directory-repo = require './directory-repo'

var repo = url ->
  if (typeof url != 'string')
    null
  else if (url.index-of '/' == 0) do
    directory-repo url
  else
    null

module.exports = repo
