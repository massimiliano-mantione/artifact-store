#external module

var directory-repo = require './directory-repo'

var repo = url ->
  if (typeof url != 'string')
    null
  else if (url.index-of '/' == 0) do
    console.log('FACTORY:', url)
    var res = directory-repo url
    console.log('REPO:', res.data)
    res
    ; directory-repo url
  else
    null

module.exports = repo
