#external process

var
  options = require './options'
  command-processor = require './commands'

var args = options (process.argv.slice 2)
command-processor args
