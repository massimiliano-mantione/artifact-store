#external (describe, it, before, after, before-each)

var
  Promise = require 'any-promise'
  expect = (require 'chai').expect
  mock-fs = require 'mock-fs'
  directory-repo = require '../lib/directory-repo'
  commands = require '../lib/commands'

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

var describe-repository = (kind, env) ->
  describe
    'Repository of kind ' + kind
    #->
      before #->
        env.before()
      after #->
        env.after()
      before-each #->
        env.before-each()

      it
        'Sees the file system'
        #->
          expect(env.directory? '/a.txt').to.equal false
          expect(env.directory? '/f3.txt').to.equal false
          expect(env.directory? '/dir2/dir3').to.equal true
          expect(env.file? '/a.txt').to.equal true
          expect(env.file? '/f3.txt').to.equal false
          expect(env.file? '/dir2/dir3').to.equal false
          expect(env.contents '/a.txt').to.equal 'a'

      it
        'Builds file names'
        #->
          var repo = env.repo-builder '/dir2'
          expect(repo.file 'f3.txt').to.equal
            if (env.has-files) '/dir2/f3.txt'
            else null
          expect(repo.file 'f1.txt').to.equal
            if (env.has-files) '/dir2/f1.txt'
            else null

      it
        'Sees files'
        done ->
          var repo = env.repo-builder '/dir2'
          Promise.all ([
            repo.check 'f3.txt'
            repo.check 'f1.txt'
          ]).then #->
            expect(#it).to.eql([true, false])
            done()

      it
        'Writes strings'
        done ->
          var repo = env.repo-builder '/dir2'
          |:
            repo.check 'new.txt'
            .then #->
              expect(#it).to.equal false
              repo.write ('new.txt', 'new')
            .then #->
              expect(#it).to.equal true
              repo.check 'new.txt'
            .then #->
              expect(#it).to.equal true
              commands.read-text(repo, 'new.txt')
            .then #->
              expect(#it).to.equal 'new'
              done()
            .catch #->
              done #it

      it
        'Writes streams'
        done ->
          var repo = env.repo-builder '/dir2'
          |:
            repo.check 'new.txt'
            .then #->
              expect(#it).to.equal false
              repo.write ('new.txt', repo.read 'f3.txt')
            .then #->
              expect(#it).to.equal true
              repo.check 'new.txt'
            .then #->
              expect(#it).to.equal true
              commands.read-text(repo, 'new.txt')
            .then #->
              expect(#it).to.equal 'f3'
              done()
            .catch #->
              done #it

      it
        'Copies a new file'
        done ->
          var repo = env.repo-builder '/dir2'
          |:
            repo.write-file ('f1.txt', '/dir1/f1.txt')
            .then #->
              expect(#it).to.equal true
              repo.check 'f1.txt'
            .then #->
              expect(#it).to.equal true
              commands.read-text(repo, 'f1.txt')
            .then #->
              expect(#it).to.equal 'f1'
              done()
            .catch #->
              done #it

      it
        'Does not copy an existing file'
        done ->
          var repo = env.repo-builder '/dir2'
          |:
            repo.write-file ('same.txt', '/dir1/same.txt')
            .then #->
              expect(#it).to.equal false
              done()
            .catch #->
              done #it

      it
        'Lists entries'
        done ->
          var
            repo = env.repo-builder '/dir1'
            entries = {}
            callback = #->
              entries[#it] = true
              Promise.resolve()
          |:
            repo.for-each callback
            .then #->
              expect(entries).to.eql {
                'f1.txt': true
                'f2.txt': true
                'same.txt': true
              }
              done()
            .catch #->
              done #it

      it
        'Removes entries'
        done ->
          var
            repo = env.repo-builder '/dir1'
          |:
            repo.remove 'same.txt'
            .then #->
              expect(#it).to.equal undefined
              Promise.resolve()
            .catch #->
              done #it
            .then #->
              repo.remove 'none.txt'
            .then #->
              done 'Error expected'
            .catch #->
              expect(#it.message).to.contain 'ENOENT'
              done()

describe
  "Repositories"
  #->
    var env = {}

    env.before = #->
    env.after = #->
    env.has-files = true
    env.before-each = #->
      env.fs = mock-fs.fs (require './sample-repo-files')
      env.repo-builder = #-> directory-repo (#it, env.fs)
      env.directory? = #-> check (env.fs, #it, 'directory')
      env.file? = #-> check (env.fs, #it, 'file')
      env.contents = #->
        try
          env.fs.read-file-sync (#it, 'utf8')
        catch (var e)
          null

    describe-repository('directory', env)
