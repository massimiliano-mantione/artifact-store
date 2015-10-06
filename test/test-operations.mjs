#external (describe, it, before-each)

var
  Promise = require 'any-promise'
  expect = (require 'chai').expect
  mock-fs = require 'mock-fs'
  directory-repo = require '../lib/directory-repo'
  hash = require '../lib/hash'
  archive = require '../lib/archive'
  checkout = require '../lib/checkout'
  pull = require '../lib/pull'
  copy = require '../lib/copy'
  trim = require '../lib/trim'
  sync = require '../lib/sync'
  gc = require '../lib/gc'
  chk = require '../lib/check'

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
  f1-hash = hash.sync('f1', 'f')
  f2-hash = hash.sync('f2', 'f')
  f3-hash = hash.sync('f3', 'f')
  f4-hash = hash.sync('f4', 'f')
  f5-hash = hash.sync('f5', 'f')
  f6-hash = hash.sync('f6', 'f')
  same-hash = hash.sync('same', 'f')
  f1-data = ['f', f1-hash, 'f1.txt'].join ':'
  f2-data = ['f', f2-hash, 'f2.txt'].join ':'
  f3-data = ['f', f3-hash, 'f3.txt'].join ':'
  f4-data = ['f', f4-hash, 'f4.txt'].join ':'
  f5-data = ['f', f5-hash, 'f5.txt'].join ':'
  f6-data = ['f', f6-hash, 'f6.txt'].join ':'
  same-data = ['f', same-hash, 'same.txt'].join ':'
  dir2-3-text = [
      f5-data
      f6-data
    ].sort().join '/'
  dir2-3-hash = hash.sync(dir2-3-text, 'd')
  dir2-text = [
      f3-data
      f4-data
      same-data
      ['d', dir2-3-hash, 'dir3'].join ':'
    ].sort().join '/'
  dir2-hash = hash.sync(dir2-text, 'd')
  dir3-text = [
      f1-data
      f3-data
      same-data
    ].sort().join '/'
  dir3-hash = hash.sync(dir3-text, 'd')
  dir2-tag = 'DIR2-v1'
  dir2-tag-hash = hash.apply-kind('t', 'DIR2-v1')

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
            expect(contents ('/repo/' + dir2-hash)).to.equal dir2-text
            expect(contents ('/repo/' + 'T-' + dir2-tag)).to.equal dir2-hash
            done()
          .catch #-> done #it

    it
      'Check out a tag'
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
      'Pull a tag'
      done ->
        var
          repo = repo-builder '/repo'
          repo2 = repo-builder '/repo2'
        |:
          archive (repo, '/dir2', dir2-tag, fs)
          .then #->
            pull (repo, repo2, dir2-tag)
          .then #->
            Promise.all ([
              repo2.check dir2-hash
              repo2.check dir2-3-hash
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
              repo2.check dir2-3-hash
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

    it
      'GC a repo'
      done ->
        var repo = repo-builder '/repo'
        |:
          archive (repo, '/dir2', dir2-tag, fs)
          .then #->
            archive (repo, '/dir3', 'DIR3', fs)
          .then #->
            repo.remove (dir2-tag-hash)
          .then #->
            gc (repo)
          .then #->
            Promise.all ([
              repo.check f4-hash
              repo.check dir2-hash
              repo.check dir3-hash
              repo.check same-hash
            ])
          .then #->
            expect(#it).to.eql ([
              false
              false
              true
              true
            ])
            done()
          .catch #-> done #it
