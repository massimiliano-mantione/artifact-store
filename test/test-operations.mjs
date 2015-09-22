#external (describe, it, before-each)

var
  Promise = require 'any-promise'
  expect = (require 'chai').expect
  mock-fs = require 'mock-fs'
  directory-repo = require '../lib/directory-repo'
  archive = require '../lib/archive'
  checkout = require '../lib/checkout'
  pull = require '../lib/pull'

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
  dir2-hash = '08ca5ef9f6dacf99bc351469faddd383ac2a9fac'
  dir3-hash = '026e49de20317e07cc8647d67307ad9be27e4a29'
  f3-hash = '619aae029dda528253a6af0ba619b45baa1df115'
  f4-hash = 'adfec5772ae8932aa10896037b0779bec915015b'
  same-hash = 'ff3390557335ba88d37755e41514beb03bc499ec'
  dir2-data = [
    'd:026e49de20317e07cc8647d67307ad9be27e4a29:dir3'
    'f:619aae029dda528253a6af0ba619b45baa1df115:f3.txt'
    'f:adfec5772ae8932aa10896037b0779bec915015b:f4.txt'
    'f:ff3390557335ba88d37755e41514beb03bc499ec:same.txt'].join '/'

describe
  "Archive operation"
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
      'Archives directories'
      done ->
        var repo = repo-builder '/repo'
        archive (repo, '/dir2', fs) |:
          .then #->
            expect(#it).to.equal dir2-hash
            expect(file? ('/repo/' + dir2-hash)).to.equal true
            expect(contents ('/repo/' + dir2-hash)).to.equal dir2-data
            done()
          .catch #-> done #it

describe
  "Checkout operation"
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
      'Checks out a repository'
      done ->
        var repo = repo-builder '/repo'
        |:
          archive (repo, '/dir2', fs)
          .then #->
            checkout (repo, '/checkout', dir2-hash, fs)
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

describe
  "Pull operation"
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
      'Pulls a hash'
      done ->
        var
          repo = repo-builder '/repo'
          repo2 = repo-builder '/repo2'
        |:
          archive (repo, '/dir2', fs)
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
