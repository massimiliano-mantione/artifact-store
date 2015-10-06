#external
  module
  process

var nopt = require "nopt"
var path = require "path"

var known-options = {
  command: [
      'archive'
      'checkout'
      'copy'
      'pull'
      'gc'
      'check'
    ]
  source: path
  destination: path
  tag: String
}

var shorthands = {
  archive: ['--command', 'archive']
  checkout: ['--command', 'checkout']
  co: ['--command', 'checkout']
  copy: ['--command', 'copy']
  cp: ['--command', 'copy']
  pull: ['--command', 'pull']
  cleanup: ['--command', 'cleanup']
  src: ['--source']
  dst: ['--destination']
  gc: ['--command', 'gc']
  check: ['--command', 'check']
}

var url-protocols = ['s3']

var recognize-url = #->
  var result = #it
  url-protocols.for-each (protocol) -> do!
    var full-protocol = protocol + ':/'
    var index = result.index-of full-protocol
    if (index >= 0)
      result = result.substring index
  result

var parse-options = (process-argv) ->
  var parsed = nopt
    known-options
    shorthands
    process-argv
    0

  [
    'command'
    'source'
    'destination'
    'tag'
  ].for-each #-> do!
    if (! parsed[#it])
      parsed[#it] = null
  [
    'source'
    'destination'
  ].for-each #-> do!
    if (typeof parsed[#it] == 'string')
      parsed[#it] = recognize-url (parsed[#it])

  parsed.error =
    if (parsed.argv.remain.length > 0)
      'Unrecognized options: ' + (parsed.argv.remain.join ' ')
    else null
  delete parsed.argv

  parsed.check-store = name ->
    var arg = this[name]
    if (arg == null)
      "Error: '--" + name + "' not specified"
    else if (arg.char-at 0 == '/') do
      try do
        var stat = (require 'fs').stat-sync arg
        if (stat.directory?())
          null
        else
          "Error: '" + arg + "' is not a directory"
      catch (var e)
        "Cannot access '" + arg + "'"
    else null

  parsed

module.exports = parse-options
