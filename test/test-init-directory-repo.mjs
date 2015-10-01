#external (describe, it, before, after)

var
  Promise = require 'any-promise'
  expect = (require 'chai').expect
  mock-fs = require 'mock-fs'
  init-directory-repo = require './init-directory-repo'
  directory-repo = require '../lib/directory-repo'
  commands = require '../lib/commands'

describe
  'Init directory repo'
  #->
    it
      'Initializes directory'
      done ->
        var
          fs = mock-fs.fs {}
          dir-path = '/dir2'
          objects = {
            'f1.txt': 'f1'
            'f2.txt': 'f2'
            'same.txt': 'same'
          }
        var
          keys = {}
          repo = null
        init-directory-repo(dir-path, objects, fs) |:
          .then #->
            repo = directory-repo(dir-path, fs)
            Promise.resolve()
          .then #->
            repo.check 'f1.txt'
          .then #->
            expect(#it).to.equal true
            repo.check 'fx1.txt'
          .then #->
            expect(#it).to.equal false
            repo.read 'same.txt'
          .then #->
            expect(typeof #it).to.equal 'object'
            commands.read-stream-as-text(#it)
          .then #->
            expect(#it).to.equal 'same'
            repo.read 'none.txt'
          .then #->
            expect(#it).to.equal null
            repo.for-each
              #->
                keys[#it] = true
                Promise.resolve()
          .then #->
            expect(keys).to.eql {
              'f1.txt': true
              'f2.txt': true
              'same.txt': true
            }
            Promise.resolve()
          .then #->
            done()
          .catch #-> done #it
