#external (describe, it, before, after)

var
  Promise = require 'any-promise'
  expect = (require 'chai').expect
  S3rver = require 's3rver'
  fortknox = require 'fortknox'
  init-bucket = require './init-s3-bucket'
  s3-utils = require '../lib/s3-utils'
  commands = require '../lib/commands'

describe
  'Init s3 Bucket'
  #->
    var (server, s3)

    before
      done ->
        server = init-bucket.run-server
          {
            port: 10001
            hostname: 'localhost'
            silent: true ; put false here to debug the server
            directory: '/tmp/s3rver_test_directory'
          }
          done

    after
      done ->
        server.close done

    it
      'Initializes bucket'
      done ->
        s3 = fortknox.createClient {
          key: '123'
          secret: 'abc'
          bucket: 'dir1'
          endpoint: 'localhost'
          style: 'path'
          port: 10001
        }
        var data = {
          client: s3
          objects: {
            'f1.txt': 'f1'
            'f2.txt': 'f2'
            'same.txt': 'same'
          }
        }
        var keys = {}
        init-bucket(data) |:
          .then #->
            s3-utils.check(s3, 'f1.txt')
          .then #->
            expect(#it).to.equal true
            s3-utils.check(s3, 'fx.txt')
          .then #->
            expect(#it).to.equal false
            s3-utils.read-stream(s3, 'same.txt')
          .then #->
            expect(typeof #it).to.equal 'object'
            commands.read-stream-as-text(#it)
          .then #->
            expect(#it).to.equal 'same'
            s3-utils.read-stream(s3, 'none.txt')
          .then #->
            expect(#it).to.equal null
            s3-utils.for-each
              s3
              #-> (keys[#it] = true)
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
