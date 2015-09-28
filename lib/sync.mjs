#external module

var
  Promise = require 'any-promise'
  copy = require './copy'
  trim = require './trim'

var sync = (source, target) ->
  copy (source, target).then #-> trim(source, target)

module.exports = sync
