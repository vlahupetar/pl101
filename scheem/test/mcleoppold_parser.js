if (typeof module !== 'undefined') {
    // In Node.js load required modules
    var assert = require('chai').assert;
		var expect = require('chai').expect;
    var PEG = require('pegjs');
    var fs = require('fs');
    var evalScheem = require('../scheem').evalScheem;
		var evalScheemString = require('../scheem').evalScheemString;
    var parse = PEG.buildParser(fs.readFileSync(
        'scheem.peg', 'utf-8')).parse;
} else {
    // In browser assume loaded by <script>
    var parse = SCHEEM.parse;
    var assert = chai.assert;
		var expect = chai.expect;
}

suite('Scheem Parser', function(){
  suite('simple', function(){
    test('atom', function(){
      assert.equal(
        parse("a"),
        'a'
      );
    });
    test('should return a list for "(a b c)"', function(){
      assert.deepEqual(
        parse("(a b c)"),
        ['a', 'b', 'c']
      );
    });
    test('should return a nested list for "(a (b))"', function(){
      assert.deepEqual(
        parse("(a(b))"),
        ['a', ['b']]
      );
    })
  });

  suite('whitespace', function(){
    test('should parse " ( a  b ) " successfully', function(){
      assert.ok(
        parse(" ( a  b ) ")
      );
    });
    test('should parse "( \\n a \\n b \\n ) " successfully', function(){
      assert.ok(
        parse("( \n a \n b \n ) ")
      );
    });
  });

  suite('quote', function(){
    test('should parse "\'x" as (quote x)', function(){
      assert.deepEqual(
        parse("'x"),
        ['quote', 'x']
      );
    });
    test('should parse "\'(1 2) as (quote (1 2))', function(){
      assert.deepEqual(
        parse("'(1 2)"),
        ['quote', [1, 2]]
      );
    });
  });
  
  suite('comment', function(){
    test('should parse ";;a\\n(1 ;;b\\n;;c 3\\n2\\n;; )\\n)" as (1 2)', function(){
      assert.deepEqual(
        parse(";;a\n(1 ;;b\n;;c 3\n2\n;; )\n)"),
        [1, 2]
      );
    });
  });

  suite('integer', function () {
    test('parse', function () {
      assert.deepEqual(
        parse('(1)'),
        [1]
      );
    });
  });
});