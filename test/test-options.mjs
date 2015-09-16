var
  expect = (require 'chai').expect
  mocks = require 'mocks'

#external (describe, it, before-each)

var split = #-> #it.split ' '

describe
  "Options parser"
  #->
    var options

    before-each #->
      var config = require './sample-files'
      var
        mocked-fs = mocks.fs.create(config)
        mocked-process = {
          cwd: #-> '/dir2'
        }
        mocked = {
          fs: mocked-fs
          process: mocked-process
        }
        options-module = mocks.load-file('./lib/options', mocked)
      ; This is a hacky way of injecting process.cwd()
      options-module.process.cwd = mocked.process.cwd
      options = options-module.module.exports

    it
      'Populates empty args'
      #->
        var args = options ([])
        expect(args.command).to.equal null
        expect(args.source).to.equal null
        expect(args.destination).to.equal null
        expect(args.tag).to.equal null
        expect(args.names).to.equal null
        expect(args.hash).to.equal null
        expect(args.error).to.equal null
        expect(typeof args.check-store).to.equal 'function'
        expect(args.check-store 'source').to.contain 'not specified'
        expect(args.check-store 'destination').to.contain 'not specified'
        expect(args.check-store 'names').to.contain 'not specified'

    it
      'Recognizes cp shortcut'
      #->
        var args = options split '-cp'
        expect(args.command).to.equal 'copy'

    it
      'Expands paths'
      #->
        var args = options split '-cp -src a.txt -dst ../b.txt -names dir3/f5.txt'
        expect(args.command).to.equal 'copy'
        expect(args.source).to.equal '/dir2/a.txt'
        expect(args.destination).to.equal '/b.txt'
        expect(args.names).to.equal '/dir2/dir3/f5.txt'
        expect(args.check-store 'source').to.contain 'Cannot access'
        expect(args.check-store 'destination').to.contain 'not a directory'
        expect(args.check-store 'names').to.contain 'not a directory'

    it
      'Recognizes directories and s3 urls'
      #->
        var args = options split '-cp -src /dir1 -dst dir3 -names s3:/remote.bucket'
        expect(args.command).to.equal 'copy'
        expect(args.source).to.equal '/dir1'
        expect(args.destination).to.equal '/dir2/dir3'
        expect(args.names).to.equal 's3:/remote.bucket'
        expect(args.check-store 'source').to.equal null
        expect(args.check-store 'destination').to.equal null
        expect(args.check-store 'names').to.equal null
