if (typeof module !== 'undefined') {
    // In Node.js load required modules
    var assert = require('chai').assert;
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
}

suite('quote', function() {
    test('a number', function() {
        assert.deepEqual(
            evalScheem(['quote', 3], {}),
            3
        );
    });
    test('an atom', function() {
        assert.deepEqual(
            evalScheem(['quote', 'dog'], {}),
            'dog'
        );
    });
    test('a list', function() {
        assert.deepEqual(
            evalScheem(['quote', [1, 2, 3]], {}),
            [1, 2, 3]
        );
    });
	test('argument error', function() {
		assert.throws(function(){
			evalScheem(['quote', [1, 2, 3], []], {});
		});
	});
});
suite('add', function() {
    test('two numbers', function() {
        assert.deepEqual(
            evalScheem(['+', 3, 5], {}),
            8
        );
    });
	test('multiple nums', function() {
		assert.deepEqual(
			evalScheem(['+',2,2,3,4,5,6.7,3.5], {}),
			2+2+3+4+5+6.7+3.5
		);
	});
    test('a number and an expression', function() {
        assert.deepEqual(
            evalScheem(['+', 3, ['+', 2, 2]], {}),
            7
        );
    });
	test('a dog and a cat', function() {
		assert.throws(function(){
			evalScheem(['+', 'dog', 'cat'], {})
		});
	});
});

suite('subtract', function() {
    test('two numbers', function() {
        assert.deepEqual(
            evalScheem(['-', 3, 5], {}),
            -2
        );
    });
	test('multiple nums', function() {
		assert.deepEqual(
			evalScheem(['-', 2,2,3,45], {}),
			2-2-3-45
		);
	});
    test('a number and an expression', function() {
        assert.deepEqual(
            evalScheem(['-', 3, ['-', 5, 2]], {}),
            0
        );
    });
	test('type error', function(){
		assert.throws(function(){
			evalScheem(['-', 3,4,5,'e','b'])
		});
	});
});

suite('multiply', function() {
    test('two numbers', function() {
        assert.deepEqual(
            evalScheem(['*', 3, 5], {}),
            15
        );
    });
    test('a number and an expression', function() {
        assert.deepEqual(
            evalScheem(['*', 3, ['*', 5, 2]], {}),
            30
        );
    });
	test('multi numbers', function() {
        assert.deepEqual(
            evalScheem(['*', 3, 5, 6, 7, 8, 9], {}),
            3* 5* 6* 7* 8* 9
        );
    });
	test('type error', function(){
		assert.throws(function(){
			evalScheem(['*', 3,4,5,'e','b'])
		});
	});
});

suite('divide', function() {
    test('two numbers', function() {
        assert.deepEqual(
            evalScheem(['/', 3, 5], {}),
            3/5
        );
    });
    test('a number and an expression', function() {
        assert.deepEqual(
            evalScheem(['/', 3, ['/', 5, 2]], {}),
            3/(5/2)
        );
    });
	test('multi numbers', function() {
        assert.deepEqual(
            evalScheem(['/', 3, 5, 6, 7, 8, 9], {}),
            3/ 5/ 6/ 7/ 8/ 9
        );
    });
	test('type error', function(){
		assert.throws(function(){
			evalScheem(['/', 3,4,5,'e','b'])
		});
	});
});

suite('var evaluate', function(){
	
	var env = {x:2, y:3, z:10};
	test('5 test',function(){
		assert.deepEqual(
			evalScheem(5, env), 
			5
		);
	});
	test('x test',function(){
		assert.deepEqual(
			evalScheem('x', env), 
			2
		);
	});
	test('(+ 2 3) test',function(){
		assert.deepEqual(
			evalScheem(['+', 2, 3], env), 
			5
		);
	});
	test('(* y 3) test',function(){
		assert.deepEqual(
			evalScheem(['*', 'y', 3], env), 
			9
		);
	});
	test('(/ z (+ x y)) test',function(){
		assert.deepEqual(
			evalScheem(['/', 'z', ['+', 'x', 'y']], env), 
			2
		);
	});
	
});
suite('define/set!', function(){
	var env = {x:2, y:3, z:10};
	test( 'x test',function(){
		assert.deepEqual(evalScheem('x', env), 2)
	});
	
	test( 'evaluation of define test',function(){
		var tmp = evalScheem(['define', 'a', 5], env);
		assert.deepEqual(tmp, 0)
	});
	test( '(define a 5) test',function(){
		assert.deepEqual(env, {x:2, y:3, z:10, a:5})
	});
	test( '(set! a 1) test',function(){
		var tmp = evalScheem(['set!', 'a', 1], env);
		assert.deepEqual(env, {x:2, y:3, z:10, a:1})
	});
	
	test( '(set! x 7) test',function(){
		var tmp = evalScheem(['set!', 'x', 7], env);
		assert.deepEqual(env, {x:7, y:3, z:10, a:1})
	});
	test( '(set! y (+ x 1)) test',function(){
		var tmp = evalScheem(['set!', 'y', ['+', 'x', 1]], env);
		assert.deepEqual(env, {x:7, y:8, z:10, a:1})
	});
	test('type error', function(){
		assert.throws(function(){
			evalScheem(['set!', 'y', ['+', 'x', 1]], {y:0})
		});
	});
});

suite('begin expression', function(){
	test( '(begin 1 2 3) test',function(){
		assert.deepEqual(evalScheem(['begin', 1, 2, 3], {}), 3);
	});
	test( '(begin (+ 2 2)) test',function(){
		assert.deepEqual(evalScheem(['begin', ['+', 2, 2]], {}), 4);
	});
	test( '(begin x y x) test',function(){
		assert.deepEqual(evalScheem(['begin', 'x', 'y', 'x'], {x:1, y:2}), 1);
	});
	test( '(begin (set! x 5) (set! x (+ y x) x)) test',function(){
		assert.deepEqual(
			evalScheem(
				['begin', 
					['set!', 'x', 5], 
					['set!', 'x', ['+', 'y', 'x']], 
				'x'], 
				{x:1, y:2}
			), 7);
	});
});

suite('quotes', function(){
	test( '(+ 2 3) test',function(){
		assert.deepEqual(evalScheem(['+', 2, 3], {}), 5);
	});
	test( '(quote (+ 2 3)) test',function(){
		assert.deepEqual(evalScheem(['quote', ['+', 2, 3]], {}), ['+', 2, 3]);
	});
	test( '(quote (quote (+ 2 3))) test',function(){
		assert.deepEqual(evalScheem(
			['quote', 
				['quote', ['+', 2, 3]]
			], {}), 
			['quote', ['+', 2, 3]]
		);
	});
});

suite('number ops', function(){
	test( '(+ 2 3) test',function(){
		assert.deepEqual(evalScheem(['+', 2, 3], {}), 5);
	});
	test( '(< 2 2) test',function(){
		assert.deepEqual(evalScheem(['<', 2, 2], {}), '#f');
	});
	test( '(< 2 3) test',function(){
		assert.deepEqual(evalScheem(['<', 2, 3], {}), '#t');
	});
	test( '(< (+ 1 1) (+ 2 3)) test',function(){
		assert.deepEqual(evalScheem(['<', ['+', 1, 1], ['+', 2, 3]], {}), '#t');
	});
});

suite('list ops', function(){
	test('(quote (2 3)) test',function(){
		assert.deepEqual(evalScheem(['quote', [2, 3]], {}), [2, 3]);
	});
	test("(cons 1 '(2 3)) test",function(){
		assert.deepEqual(evalScheem(['cons', 1, ['quote', [2, 3]]], {}),[1, 2, 3]);
	});
	test("(cons '(1 2) '(3 4)) test",function(){
		assert.deepEqual(evalScheem(['cons', ['quote', [1, 2]], ['quote',[3, 4]]], {}), [[1, 2], 3, 4]);
	});
	test("(car '((1 2) 3 4)) test",function(){
		assert.deepEqual(evalScheem(['car', ['quote', [[1, 2], 3, 4]]], {}),[1, 2]);
	});
	test("(cdr '((1 2) 3 4)) test",function(){
		assert.deepEqual(evalScheem(['cdr', ['quote', [[1, 2], 3, 4]]], {}),[3, 4]);
	});
});

suite('conditionals', function(){
	test( '(if (= 1 1) 2 3) test',function(){
		assert.deepEqual(evalScheem(['if', ['=', 1, 1], 2, 3], {}), 2);
	});
	test( '(if (= 1 0) 2 3) test',function(){
		assert.deepEqual(evalScheem(['if', ['=', 1, 0], 2, 3], {}), 3);
	});
	test( '(if (= 1 1) 2 error) test',function(){
		assert.deepEqual(evalScheem(['if', ['=', 1, 1], 2, 'error'], {}), 2);
	});
	test( '(if (= 1 1) error 3) test',function(){
		assert.deepEqual(evalScheem(['if', ['=', 1, 0], 'error', 3], {}), 3);
	});
	test( '(if (= 1 1) (if (= 2 3) 10 11) 12) test',function(){
		assert.deepEqual(evalScheem(['if', ['=', 1, 1], ['if', ['=', 2, 3], 10, 11], 12], {}), 11);
	});
	test('type error', function(){
		assert.throws(function(){
			evalScheem(['if', ['+', 1, 0], 2, 3], {})
		});
	});
	test('argument error', function(){
		assert.throws(function(){
			evalScheem(['if', ['=', 1, 0], 2], {})
		});
	});
});

suite('parse', function() {
    test('a number', function() {
        assert.deepEqual(
            parse('42'),
            42
        );
    });
    test('a variable', function() {
        assert.deepEqual(
            parse('x'),
            'x'
        );
    });
	test('complex scheem parse', function() {
		assert.deepEqual(
            evalScheem(parse("(if (= 1 (+ 1 (- 2 3))) (car '((1 2) (3 4))) '(2 1))"),{}),
            [2,1]
        );
    });
});
