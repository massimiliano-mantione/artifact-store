#external module

var
  Promise = require 'any-promise'
  get-hash-kind = (require './hash').get-kind
  commands = require './commands'

var gc = (repo) ->
  var
    errors = []
    root-tags = []
    dirs-to-read = []
    dirs = {}
    todo = []
    reached = {}
    processed = {}

  var process-entry = hash -> do!
    processed[hash] = true
    reached[hash] = true
    if (typeof dirs[hash] == 'string')
      var dir = commands.parse-dir-data dirs[hash]
      dir.for-each #-> do!
        var entry = #it.hash
        if (! processed[entry])
          todo.push entry

  var result = repo.for-each
    hash -> do!
      var kind = get-hash-kind hash
      if (kind == 'T')
        root-tags.push
          commands.read-text(repo, hash)
      else
        if (kind == 'D')
          dirs-to-read.push hash
        reached[hash] = false
  result |:
    .then #->
      Promise.all root-tags
    .then #->
      #it.for-each #->
        reached[#it] = true
        todo.push #it
      Promise.all
        dirs-to-read.map dir-hash ->
          commands.read-text(repo, dir-hash).then #->
            Promise.resolve do
              dirs[dir-hash] = #it
              true
    .then #->
      while (todo.length > 0)
        process-entry(todo.pop())
      (Object.keys reached).for-each #-> do!
        if (reached[#it] == false)
          todo.push #it
      Promise.all
        todo.map #->
          repo.remove #it


module.exports = gc
