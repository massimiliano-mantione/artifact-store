#external (describe, it, before-each)

var
  expect = (require 'chai').expect
  mock-fs = require 'mock-fs'
  directory-repo = require '../lib/directory-repo'

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

describe
  "Directory repository"
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
      'Sees the file system'
      #->
        expect(directory? '/a.txt').to.equal false
        expect(directory? '/f3.txt').to.equal false
        expect(directory? '/dir2/dir3').to.equal true
        expect(file? '/a.txt').to.equal true
        expect(file? '/f3.txt').to.equal false
        expect(file? '/dir2/dir3').to.equal false
        expect(contents '/a.txt').to.equal 'a'

    it
      'Builds file names'
      #->
        var repo = repo-builder '/dir2'
        expect(repo.file 'f3.txt').to.equal '/dir2/f3.txt'
        expect(repo.file 'f1.txt').to.equal '/dir2/f1.txt'

    it
      'Sees files'
      #->
        var repo = repo-builder '/dir2'
        expect(repo.check 'f3.txt').to.equal true
        expect(repo.check 'f1.txt').to.equal false

    it
      'Writes strings'
      done ->
        var repo = repo-builder '/dir2'
        expect(file? '/dir2/new.txt').to.equal false
        |:
          repo.write ('new.txt', 'new')
          .then #->
            expect(#it).to.equal true
            expect(file? '/dir2/new.txt').to.equal true
            expect(contents '/dir2/new.txt').to.equal 'new'
            done()
          .catch #->
            done #it

    it
      'Writes streams'
      done ->
        var repo = repo-builder '/dir2'
        expect(file? '/dir2/new.txt').to.equal false
        |:
          repo.write ('new.txt', repo.read 'f3.txt')
          .then #->
            expect(#it).to.equal true
            expect(file? '/dir2/new.txt').to.equal true
            expect(contents '/dir2/new.txt').to.equal 'f3'
            done()
          .catch #->
            done #it

    it
      'Copies a new file'
      done ->
        var repo = repo-builder '/dir2'
        |:
          repo.write-file ('f1.txt', '/dir1/f1.txt')
          .then #->
            expect(#it).to.equal true
            expect(file? '/dir2/f1.txt').to.equal true
            expect(contents '/dir2/f1.txt').to.equal 'f1'
            done()
          .catch #->
            done #it

    it
      'Does not copy an existing file'
      done ->
        var repo = repo-builder '/dir2'
        |:
          repo.write-file ('same.txt', '/dir1/same.txt')
          .then #->
            expect(#it).to.equal false
            done()
          .catch #->
            done #it
