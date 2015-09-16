#external module

var commands = {
  'archive': args ->
  'checkout': args ->
  'copy': args ->
  'pull': args ->
  'cleanup': args ->
}

module.exports = args ->
  var cmd = commands [args.command]
  if (cmd == undefined)
    console.log ('Unrecognized command')
  cmd args
