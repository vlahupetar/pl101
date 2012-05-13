if (typeof module !== 'undefined') {
    // In Node.js load required modules
    var assert = require('chai').assert;
    var PEG = require('pegjs');
    var fs = require('fs');
    var evalScheem = require('../scheem').evalScheem;
		var update = require('../scheem').update;
		var add_binding = require('../scheem').add_binding;
		var lookup = require('../scheem').lookup;
    var parse = PEG.buildParser(fs.readFileSync(
        'scheem.peg', 'utf-8')).parse;
} else {
    // In browser assume loaded by <script>
    var parse = SCHEEM.parse;
    var assert = chai.assert;
}

suite('lookup', function() {
	var env1 = { name: 'x', value: 19, outer: null };
	var env2 = { name: 'y', value: 16, outer: env1 };
	var env3 = { name: 'x', value: 2, outer: env2 };

	test('Single binding', function(){
		assert.deepEqual(lookup(env1, 'x'), 19);
	});
	test('Double binding inner', function(){
		assert.deepEqual(lookup(env2, 'y'), 16);
	});
	test('Double binding outer', function(){
		assert.deepEqual(lookup(env2, 'x'), 19);
	});
	test('Triple binding inner', function(){
		assert.deepEqual(lookup(env3, 'x'), 2);
	});
});

suite('let-one', function(){
	var env1 = { name: 'x', value: 19, outer: null };
	var env2 = { name: 'y', value: 16, outer: env1};
	var env3 = { name: 'x', value: 2, outer: env2};

	test('Variable reference in environment', function(){
		assert.deepEqual(evalScheem('x', env3), 2);
	});
	test('Variable references in environment', function(){
		assert.deepEqual(evalScheem(['+', 'x', 'y'], env3), 18);
	});
	test('let-one with computed value', function(){
		assert.deepEqual(evalScheem(['let-one', 'x', ['+', 2, 2], 'x'], env3),4);
	});
	test('let-one with environment, inner reference', function(){
		assert.deepEqual(evalScheem(['let-one', 'z', 7, 'z'], env3),7);
	});
	test('let-one with environment, outer reference', function(){
		assert.deepEqual(evalScheem(['let-one', 'x', 7, 'y'], env3), 16);
	});
});

suite('update', function(){
	var env1 = { name: 'x', value: 19, outer: null };
	var env1u = { name: 'x', value: 20, outer: null };
	var env2 = { name: 'y', value: 16, outer:
			{ name: 'x', value: 19, outer: null }};
	var env2u = { name: 'y', value: 10, outer:
			{ name: 'x', value: 19, outer: null }};
	var env2v = { name: 'y', value: 10, outer:
			{ name: 'x', value: 20, outer: null }};
	var env3 = { name: 'x', value: 2, outer: 
			{ name: 'y', value: 16, outer: 
					{ name: 'x', value: 19, outer: null }}};
	var env3u = { name: 'x', value: 9, outer:
			{ name: 'y', value: 16, outer: 
					{ name: 'x', value: 19, outer: null }}};

	test('Single binding', function(){
		update(env1, 'x', 20);
		assert.deepEqual(env1, env1u);
	});
	test('Double binding inner', function(){
		update(env2, 'y', 10);
		assert.deepEqual(env2, env2u);
	});
	test('Double binding outer', function(){
		update(env2, 'x', 20);
		assert.deepEqual(env2, env2v);
	});
	test('Triple binding inner', function(){
		update(env3, 'x', 9);
		assert.deepEqual(env3, env3u);
	});
});

suite('function values', function(){
	var always3 = function (x) { return 3; };
	var identity = function (x) { return x; };
	var plusone = function (x) { return x + 1; };
	var env = {
			name: 'always3', value: always3, outer: {
			name: 'identity', value: identity, outer: {
			name: 'plusone', value: plusone, outer: null}}};

	test('(always3 5)', function(){
		assert.deepEqual(evalScheem(['always3', 5], env), 3);
	});
	test('(identity 5)', function(){
		assert.deepEqual(evalScheem(['identity', 5], env), 5);
	});
	test('(plusone 5)', function(){
		assert.deepEqual(evalScheem(['plusone', 5], env), 6);
	});
	test('(plusone (always3 5))', function(){
		assert.deepEqual(evalScheem(['plusone', ['always3', 5]], env), 4);
	});
	test('(plusone (+ (plusone 2) (plusone 3)))', function(){
		assert.deepEqual(evalScheem(['plusone', ['+', ['plusone', 2], ['plusone', 3]]], env), 8);
	});
});

suite('lambda', function(){
	test('((lambda x x) 5)', function(){
		assert.deepEqual(evalScheem([['lambda', 'x', 'x'], 5], null), 5);
	});
	test('((lambda x (+ x 1)) 5)', function(){
		assert.deepEqual(evalScheem([['lambda', 'x', ['+', 'x', 1]], 5], null), 6);
	});
	test('(((lambda x (lambda y (+ x y))) 5) 3)', function(){
		assert.deepEqual(evalScheem([[['lambda', 'x', ['lambda', 'y', ['+', 'x', 'y']]], 5], 3], null), 8);
	});
	test('(((lambda x (lambda x (+ x x))) 5) 3)', function(){
		assert.deepEqual(evalScheem([[['lambda', 'x',	['lambda', 'x', ['+', 'x', 'x']]], 5], 3], null), 6);
	});
});

suite('simple recursion', function(){
	var env1 = { name: 'x', value: 19, outer: null };
	var env1u = { name: 'y', value: 3, outer: 
			{ name: 'x', value: 19, outer: null }};

	var env2 = { name: 'y', value: 16, outer:
			{ name: 'x', value: 19, outer: null }};
	var env2u = { name: 'z', value: 9, outer: 
			{ name: 'y', value: 16, outer:
			{ name: 'x', value: 19, outer: null }}};

	test('Simple new binding', function(){
		add_binding(env1, 'y', 3);
		assert.deepEqual(env1, env1u);
	});
	test('New binding', function(){
		add_binding(env2, 'z', 9);
		assert.deepEqual(env2, env2u);
	});
});