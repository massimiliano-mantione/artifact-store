#external (describe, it, before, after, before-each)

var
  Promise = require 'any-promise'
  expect = (require 'chai').expect
  mock-fs = require 'mock-fs'
  S3rver = require 's3rver'
  fortknox = require 'fortknox'
  directory-repo = require '../lib/directory-repo'
  commands = require '../lib/commands'
  init-s3-bucket = require './init-s3-bucket'

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

var describe-repository = (kind, env-builder) ->
  describe
    'Repository of kind ' + kind
    #->
      var env = env-builder()
      before
        done -> env.before done
      after
        done -> env.after done
      before-each
        done -> env.before-each done

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
          var repo
          (env.repo-builder 'dir2').then #->
            repo = #it
            expect(repo.file 'f3.txt').to.equal
              if (env.has-files) '/dir2/f3.txt'
              else null
            expect(repo.file 'f1.txt').to.equal
              if (env.has-files) '/dir2/f1.txt'
              else null

      it
        'Sees files'
        done ->
          var repo
          (env.repo-builder 'dir2') |:
            .then #->
              repo = #it
              Promise.all ([
                repo.check 'f3.txt'
                repo.check 'f1.txt'
              ])
            .then #->
              expect(#it).to.eql([true, false])
              done()

      it
        'Writes strings'
        done ->
          var repo
          (env.repo-builder 'dir2') |:
            .then #->
              repo = #it
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
          var repo
          (env.repo-builder 'dir2') |:
            .then #->
              repo = #it
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
          var repo
          (env.repo-builder 'dir2') |:
            .then #->
              repo = #it
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
          var repo
          (env.repo-builder 'dir2') |:
            .then #->
              repo = #it
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
            repo
            entries = {}
            callback = #->
              entries[#it] = true
              Promise.resolve()
          (env.repo-builder 'dir1') |:
            .then #->
              repo = #it
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
          var repo
          (env.repo-builder 'dir1') |:
            .then #->
              repo = #it
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
    var dir-env-builder = #->
      var env = {}
      env.before = done -> done()
      env.after = done -> done()
      env.has-files = true
      env.before-each = done ->
        env.fs = mock-fs.fs (require './sample-repo-files')
        env.repo-builder = #->
          Promise.resolve directory-repo ('/' + #it, env.fs)
        env.directory? = #-> check (env.fs, #it, 'directory')
        env.file? = #-> check (env.fs, #it, 'file')
        env.contents = #->
          try
            env.fs.read-file-sync (#it, 'utf8')
          catch (var e)
            null
        done()
      env

    describe-repository('directory', dir-env-builder)

    var s3-env-builder = #->
      var env = {}
      env.before = done ->
        env.server = init-s3-bucket.run-server
          {
            port: 10001
            hostname: 'localhost'
            silent: true ; put false here to debug the server
            directory: '/tmp/s3rver_test_directory'
          }
          done
      env.after = done ->
        env.server.close done
      env.has-files = false
      env.before-each = done ->
        env.fs = mock-fs.fs (require './sample-repo-files')
        env.bucket-data = {
          'dir1' : {
            'f1.txt': 'f1'
            'f2.txt': 'f2'
            'same.txt': 'same'
          }
          'dir2' : {
            'f3.txt': 'f3'
            'f4.txt': 'f4'
            'same.txt': 'same'
          }
        }
        env.repo-builder = name -> new Promise
          (resolve, reject) ->
            env.s3 = fortknox.createClient {
              key: '123'
              secret: 'abc'
              bucket: name
              endpoint: 'localhost'
              style: 'path'
              port: 10001
            }
            var bucket-data = {
              client: env.s3
              objects: env.data[name]
            }
            init-s3-bucket(bucket-data) |:
              .then #-> resolve null ; put repo here!!!
              .catch #-> reject #it
        env.directory? = #-> check (env.fs, #it, 'directory')
        env.file? = #-> check (env.fs, #it, 'file')
        env.contents = #->
          try
            env.fs.read-file-sync (#it, 'utf8')
          catch (var e)
            null
      env
