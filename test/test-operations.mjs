#external (describe, it, before-each)

var
  Promise = require 'any-promise'
  expect = (require 'chai').expect
  mock-fs = require 'mock-fs'
  directory-repo = require '../lib/directory-repo'
  archive = require '../lib/archive'
  checkout = require '../lib/checkout'
  pull = require '../lib/pull'
  copy = require '../lib/copy'
  trim = require '../lib/trim'
  sync = require '../lib/sync'

var check = (fs, path, kind) ->
  try do
    var stat = fs.stat-sync path
    if (kind == 'directory')
      stat.directory?()
    else if (kind == 'file')
      stat.file?()
    else
      false
  catch (var e)
    false

var
  dir2-hash = 'D-91168c13aa4283bb352aee5251d08f54abc255ad'
  dir3-hash = 'D-cad9d91ad47f5348e6573e5d25814e30db8e4c52'
  f3-hash = 'F-619aae029dda528253a6af0ba619b45baa1df115'
  f4-hash = 'F-adfec5772ae8932aa10896037b0779bec915015b'
  same-hash = 'F-ff3390557335ba88d37755e41514beb03bc499ec'
  dir2-data = [
    'd:D-cad9d91ad47f5348e6573e5d25814e30db8e4c52:dir3'
    'f:F-619aae029dda528253a6af0ba619b45baa1df115:f3.txt'
    'f:F-adfec5772ae8932aa10896037b0779bec915015b:f4.txt'
    'f:F-ff3390557335ba88d37755e41514beb03bc499ec:same.txt'].join '/'
  dir2-tag = 'DIR2-v1'

describe
  "Operations"
  #->
    var (fs, repo-builder, file?, directory?, link?, contents)

    before-each #->
      fs = mock-fs.fs (require './sample-repo-files')
      repo-builder = #-> directory-repo (#it, fs)
      directory? = #-> check (fs, #it, 'directory')
      file? = #-> check (fs, #it, 'file')
      contents = #->
        try
          fs.read-file-sync (#it, 'utf8')
        catch (var e)
          null

    it
      'Archive a directory'
      done ->
        var repo = repo-builder '/repo'
        archive (repo, '/dir2', dir2-tag, fs) |:
          .then #->
            expect(#it).to.equal dir2-hash
            expect(file? ('/repo/' + dir2-hash)).to.equal true
            expect(contents ('/repo/' + dir2-hash)).to.equal dir2-data
            expect(contents ('/repo/' + 'T-' + dir2-tag)).to.equal dir2-hash
            done()
          .catch #-> done #it

    it
      'Check out a hash'
      done ->
        var repo = repo-builder '/repo'
        |:
          archive (repo, '/dir2', dir2-tag, fs)
          .then #->
            checkout (repo, '/checkout', dir2-tag, fs)
          .then #->
            expect(#it).to.equal true
            expect(directory? '/checkout').to.equal true
            expect(directory? '/checkout/dir3').to.equal true
            expect(file? '/checkout/same.txt').to.equal true
            expect(contents '/checkout/same.txt').to.equal 'same'
            expect(file? '/checkout/dir3/f6.txt').to.equal true
            expect(contents '/checkout/dir3/f6.txt').to.equal 'f6'
            done()
          .catch #-> done #it

    it
      'Pull a hash'
      done ->
        var
          repo = repo-builder '/repo'
          repo2 = repo-builder '/repo2'
        |:
          archive (repo, '/dir2', dir2-tag, fs)
          .then #->
            pull (repo, repo2, dir2-hash)
          .then #->
            Promise.all ([
              repo2.check dir2-hash
              repo2.check dir3-hash
              repo2.check f3-hash
              repo2.check f4-hash
              repo2.check same-hash
            ])
          .then #->
            expect(#it).to.eql ([
              true
              true
              true
              true
              true
            ])
            done()
          .catch #-> done #it

    it
      'Copy a repo'
      done ->
        var
          repo = repo-builder '/repo'
          repo2 = repo-builder '/repo2'
        |:
          archive (repo, '/dir2', dir2-tag, fs)
          .then #->
            copy (repo, repo2)
          .then #->
            Promise.all ([
              repo2.check dir2-hash
              repo2.check dir3-hash
              repo2.check f3-hash
              repo2.check f4-hash
              repo2.check same-hash
            ])
          .then #->
            expect(#it).to.eql ([
              true
              true
              true
              true
              true
            ])
            done()
          .catch #-> done #it

    it
      'Trim a repo'
      done ->
        var
          repo1 = repo-builder '/dir1'
          repo2 = repo-builder '/dir3'
        |:
          trim (repo1, repo2)
          .then #->
            Promise.all ([
              repo2.check 'f1.txt'
              repo2.check 'f2.txt'
              repo2.check 'f3.txt'
              repo2.check 'same.txt'
            ])
          .then #->
            expect(#it).to.eql ([
              true
              false
              false
              true
            ])
            done()
          .catch #-> done #it


    it
      'Sync a repo'
      done ->
        var
          repo1 = repo-builder '/dir1'
          repo2 = repo-builder '/dir3'
        |:
          sync (repo1, repo2)
          .then #->
            Promise.all ([
              repo2.check 'f1.txt'
              repo2.check 'f2.txt'
              repo2.check 'f3.txt'
              repo2.check 'same.txt'
            ])
          .then #->
            expect(#it).to.eql ([
              true
              true
              false
              true
            ])
            done()
          .catch #-> done #it
