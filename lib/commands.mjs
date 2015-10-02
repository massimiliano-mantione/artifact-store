#external module

var
  Promise = require 'any-promise'
  ; Should fix this for Windows
  ; path-delimiter = (require 'path').delimiter
  path-delimiter = '/'

var commands = {
  'archive': args ->
  'checkout': args ->
  'copy': args ->
  'pull': args ->
  'cleanup': args ->
}

var perform-cmd = args ->
  var cmd = commands [args.command]
  if (cmd == undefined)
    console.log ('Unrecognized command')
  cmd args

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
