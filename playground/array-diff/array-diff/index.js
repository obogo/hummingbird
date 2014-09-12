
var _ = require('underscore')
var longestCommonSubstring = require('longest-common-substring')

var diff = function(before, after) {
  var commonSeq = longestCommonSubstring(before, after)
  var startBefore = commonSeq.startString1
  var startAfter = commonSeq.startString2
  if (commonSeq.length == 0) {
    var result = before.map(function(each) { return ['-', each]})
    return result.concat(after.map(function(each) { return ['+', each]}))
  }
  var beforeLeft = before.slice(0, startBefore)
  var afterLeft = after.slice(0, startAfter)
  var equal = after.slice(startAfter, startAfter + commonSeq.length)
    .map(function(each) {return ['=', each]})
  var beforeRight = before.slice(startBefore + commonSeq.length)
  var afterRight = after.slice(startAfter + commonSeq.length)
  return _.union(diff(beforeLeft, afterLeft), equal, diff(beforeRight, afterRight))
}

var orderedSetDiff = function(before, after) {
  var diffRes = diff(before, after)
  var result = []
  diffRes.forEach(function(each) {
    switch(each[0]) {
      case '=':
        result.push(each)
        break
      case '-':
        result.push((after.indexOf(each[1]) > -1) ? ['x', each[1]] : ['-', each[1]])
        break
      case '+':
        result.push((before.indexOf(each[1]) > -1) ? ['p', each[1]] : ['+', each[1]])
    }
  })
  return result
}

var compress = function(diff) {
  var result = []
  var modifier
  var section = []
  diff.forEach(function(each) {
    if(modifier && (each[0] == modifier)) {
      section.push(each[1])
    } else {
      if(modifier) result.push([modifier, section])
      section = [each[1]]
      modifier = each[0]
    }
  })
  if(modifier) result.push([modifier, section])
  return result
}

module.exports = function(opts) {
  opts = opts || {}
  return function(before, after) {
    var result = opts.unique ? orderedSetDiff(before, after) : diff(before, after)
    return opts.compress ? compress(result) : result
  }
}