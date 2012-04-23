var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs'); // for loading files

// Read file contents
var data = fs.readFileSync('scheem.peg', 'utf-8');
// Show the PEG grammar file
console.log(data);
// Create my parser
var parse = PEG.buildParser(data).parse;
// Do a test
assert.deepEqual( parse("(a b c)"), ["a", "b", "c"] );
//whitespaces

assert.equal(parse('         \t \n a   \n '), 'a');
assert.deepEqual(parse('\t(\n\t\ta b c\n\t\t\n\t)\t'), ['a','b','c'])

//quote tests
assert.deepEqual( parse("'a"), parse('(quote a)'));
assert.deepEqual( parse("'(a b c)"), parse ('(quote (a b c))'));
//more complex test
assert.deepEqual( parse("'('(a b 'c))"), parse ('(quote((quote(a b(quote c)))))'));
//add comment
assert.deepEqual(parse(';;testing comments\n\t(\n\t\ta b c\n\t\t\n\t)\t'), ['a','b','c'])
assert.deepEqual( parse(";;testing comment \n'a"), ['quote','a']); 
assert.deepEqual( parse(";;testing comment \n '( ;;inner quote \n '(a b 'c))"), parse ('(quote((quote(a b(quote c)))))'));