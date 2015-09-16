#external (describe, it, before-each)

var
  expect = (require 'chai').expect
  sstr = require 'string-streamer'
  hash = require '../lib/hash'

describe
  'Hash'
  #->

    it
      'Hashes synchronously'
      #->
        var result = hash.sync 'Foo!'
        expect(result).to.equal '52d5b977e091d02281056e295b80f2d97e5ed092'

    it
      'Hashes asynchronously'
      done ->
        hash(sstr 'Foo!') |:
          .then #->
            expect(#it).to.equal '52d5b977e091d02281056e295b80f2d97e5ed092'
            done()
          .catch #->
            done #it
