#external (Buffer, module)

var
  Promise = require 'any-promise'
  directory-repo = require '../lib/directory-repo'

var init-repo = (path, objects, fs) -> new Promise
  (resolve, reject) -> do!
    if (typeof fs == undefined)
      fs = require 'fs'
    |:
      fs.rmdir(path, #next)
      #->
        fs.mkdir(path, #next)
      #-> do!
        if (#it) reject #it
        else
          var
            repo = directory-repo(path, fs)
            keys = Object.keys objects
            results = keys.map #->
              repo.write(#it, objects[#it])
          Promise.all(results) |:
            .then #-> resolve()
            .catch #-> reject #it

module.exports = init-repo
