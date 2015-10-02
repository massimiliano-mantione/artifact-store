#external module

var
  Promise = require 'any-promise'
  ; Should fix this for Windows
  ; path-delimiter = (require 'path').delimiter
  path-delimiter = '/'
  repo-factory = require './repo-factory'

var usage = '''
Usage: arts
  --command (archive|checkout|copy|pull)
  --source repository
  --destination: repository
  --tag string
  --names repository
  --hash string
'''

var check-repo = (name, repo) ->
  if (repo == null || repo == undefined) do
    console.log('Invalid or missing repository: ' + name)
    false
  else
    true

var check-string = (name, value) ->
  if (typeof value != 'string') do
    console.log('Invalid or missing argument: ' + name)
    false
  else
    true

var verifier = {
  command: check-string
  source: check-repo
  destination: check-repo
  tag: check-string
  names: check-repo
  hash: check-string
}

var required-args = {
  'archive': ['source', 'destination', 'tag', 'names']
  'checkout': ['source', 'destination', 'tag', 'names']
  'copy': ['source', 'destination']
  'pull': ['source', 'destination', 'hash']
  'trim': ['source', 'destination']
  'cleanup': ['source']
}

var perform-cmd;

var commands = {
  'archive': data-args ->
    (require './archive')(data-args.destination, data-args.source.data) |:
      .then #->
        data-args.names.write(data-args.tag, #it)

  'checkout': data-args ->
    perform-cmd.read-text (data-args.names, data-args.tag) |:
      .then #->
        (require './checkout')(data-args.source, data-args.destination.data, #it)

  'copy': data-args -> Promise.reject 'unimplemented'
  'pull': data-args -> Promise.reject 'unimplemented'
  'trim': data-args -> Promise.reject 'unimplemented'
  'cleanup': data-args -> Promise.reject 'unimplemented'
}

perform-cmd = args -> do!
  var cmd = commands [args.command]
  if (cmd == undefined)
    console.log usage
  else
    var data-args = {
      source: repo-factory args.source
      destination: repo-factory args.destination
      tag: args.tag
      names: repo-factory args.names
      hash: args.hash
    }
    var required = required-args[args.command]
    var ok = required.reduce
      (prev, curr) ->
        (verifier[curr](curr, data-args[curr])) && prev
      true
    if (! ok)
      console.log usage
    else
      cmd(data-args) |:
        .then #-> console.log 'OK'
        .catch #-> console.log #it

perform-cmd.read-stream-as-text = (stream) -> new Promise
  (resolve, reject) -> do!
    var data = ''
    stream.set-encoding 'utf8'
    stream.on
      'data'
      #-> (data += #it)
    stream.on
      'error'
      #-> (reject #it)
    stream.on
      'end'
      #-> (resolve data)

perform-cmd.read-text = (repo, hash) ->
  repo.read(hash).then #->
    perform-cmd.read-stream-as-text (#it)

perform-cmd.parse-dir-data = dir-data ->
  dir-data.split('/').map #->
    var parts = #it.split ':'
    {
      kind: parts[0]
      hash: parts[1]
      name: parts[2]
    }

module.exports = perform-cmd
