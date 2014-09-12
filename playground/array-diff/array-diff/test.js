
var assert = require('assert')

var diff = require('./index')({unique:true})
var diffCompressed = require('./index')({unique:true, compress: true})

describe('diff', function() {
  it('should find the position diff', function() {
    var before = [1, 2, 3, 4]
    var after = [2, 1, 5]
    var diffExpected = [
      ['x', 1],
      ['=', 2],
      ['-', 3],
      ['-', 4],
      ['p', 1],
      ['+', 5]
    ]
    var diffRes = diff(before, after, true)
    assert.deepEqual(diffRes, diffExpected)
  })
  it('should find more diffs...', function() {
    var before = [1, 2, 3, 4, 5]
    var after1 = [1, 6, 2, 3, 5, 4]
    var diffExpected1 = [
      ['=', 1],
      ['+', 6],
      ['=', 2],
      ['=', 3],
      ['x', 4],
      ['=', 5],
      ['p', 4]
    ]
    var diffRes1 = diff(before, after1, true)
    assert.deepEqual(diffRes1, diffExpected1)

    var after2 = [1, 2, 3, 4, 7, 5]
    var diffExpected2 = [
      ['=', 1],
      ['=', 2], 
      ['=', 3],
      ['=', 4],
      ['+', 7],
      ['=', 5]
    ]
    var diffRes2 = diff(before, after2, true)
    assert.deepEqual(diffRes2, diffExpected2)

    var before = [1,2,3]
    var after = [5,4,3]
    var expected = [ [ '-', 1 ], [ '-', 2 ], [ '+', 5 ], [ '+', 4 ], [ '=', 3 ] ]
    var diffRes3 = diff(before, after, true)
    assert.deepEqual(diffRes3, expected)
  })
  it('should return the diff compressed', function() {
    var diff = diffCompressed([1, 2, 3, 4, 5], [1, 2, 3, 4, 7, 5])
    var expected = [['=', [1, 2, 3, 4]], ['+', [7]], ['=', [5]]]
    assert.deepEqual(diff, expected)

    var diff = diffCompressed([1, 2, 3, 4, 5, 6], [1, 2, 3, 6, 4, 5])
    var expected = [['=',[1,2,3]],['p',[6]],['=',[4,5]],['x',[6]]]
    assert.deepEqual(diff, expected)
  })
})

