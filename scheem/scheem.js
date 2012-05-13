if (typeof module !== 'undefined'){
	var SCHEEM = require('./parser').SCHEEM;
	var parse = SCHEEM.parse;
}

var lookup = function(env, v){
	return env.name===v?env.value:lookup(env.outer, v);
}
var update = function(env,v,val){
	return env.name===v?env.value=val:update(env.outer, v, val);
}
var add_binding = function (env, v, val, initial) {
	if (env.name) {
		env.outer = {
			name: env.name,
			value: env.value,
			outer: env.outer
		};
	} else {
		env.outer = initial ? null : {};
	}
	env.name = v;
	env.value = val;
};
var initial_env = (function () {
	var name
		, env = {}
		, fns = {
			'assert-args-0': function () {
				return arguments.length === 0 ? '#t' : '#f';
			},
			'assert-args-1': function () {
				return arguments.length === 1 ? '#t' : '#f';
			},
			'assert-args-2': function () {
				return arguments.length === 2 ? '#t' : '#f';
			},
			'+': function (x, y) { return x + y; },
			'-': function (x, y) { return x - y; },
			'*': function (x, y) { return x * y; },
			'/': function (x, y) { return x / y; },
			'=': function (x, y) { return x === y ? '#t' : '#f'; },
			'>': function (x, y) { return x > y ? '#t' : '#f'; },
			'<': function (x, y) { return x < y ? '#t' : '#f'; },
			'<=>': function (x, y) { return x < y ? -1 : (x === y ? 0 : 1); },
			'cons': function (x, y) { return [x].concat(y); },
			'car': function (x, y) { return x[0]; },
			//'cdr': function (x, y) { x.shift(); return x; },
			'cdr': function (x, y) { return x.slice(1); },
			'alert': function (arg) { console.log(arg); return arg; },
		}
	;
	for (name in fns) {
		add_binding(env, name, fns[name], true);
	}
	return env;
}());
	
var evalScheem = function (expr, env) {
	var l = expr.length;
	if (env === null)
		env = {};
	// Numbers evaluate to themselves
	if (typeof expr === 'number') {
			return expr;
	}
	// Strings are variable references
	if (typeof expr === 'string') {
			return lookup(env, expr);
	}
	// Look at head of list for operation
	switch (expr[0]) {
		case '+':
			var sum = 0;
			for (var i=1; i<l; i++)
				sum += evalScheem(expr[i], env);
			if (isNaN(sum))
				throw new Error("type error: addition is defined for numbers only");
						return sum;
		case '-':
			var sub = evalScheem(expr[1], env);
			for (var i=2; i<l; i++)
				sub -= evalScheem(expr[i], env);
			if (isNaN(sub))
				throw new Error("type error: subtraction is defined for numbers only");
						return sub;
		case '*':
			var prod = 1;
			for (var i=1; i<l; i++)
				prod *= evalScheem(expr[i], env);
			if (isNaN(prod))
				throw new Error("type error: multiplication is defined for numbers only");
						return prod;
		case '/':
			var div = evalScheem(expr[1], env);
			for (var i=2; i<l; i++)
				div /=evalScheem(expr[i], env);
			if (isNaN(div))
				throw new Error("type error: division is defined for numbers only");
						return div;
		case 'quote':
			if (l===1)
				throw new Error("argument error: empty argument list");
			if (l>2)
				throw new Error("argument error: quote works with single argument");
			return expr[1];
		case 'set!':
			update (env, expr[1], evalScheem(expr[2], env));
			return 0;
		case 'define':
			add_binding(env,expr[1],expr[2]);
			return 0;
		case 'begin':
			var res;
			for (var i=1;i<expr.length;i++)
				res=evalScheem(expr[i], env);
			return res;
		case '<':
						var eq = evalScheem(expr[1],env)<evalScheem(expr[2],env);
						return eq?'#t':'#f';
		case '>':
						var eq = evalScheem(expr[1],env)>evalScheem(expr[2],env);
						return eq?'#t':'#f';
		case 'cons':
						return [evalScheem(expr[1],env)]
								.concat(evalScheem(expr[2],env));
		case 'car':
						return evalScheem(expr[1], env).shift();
		case 'cdr':
						return evalScheem(expr[1], env).slice(1);
		case '=':
						var eq =
								(evalScheem(expr[1], env) ===
								 evalScheem(expr[2], env));
						if (eq) return '#t';
						return '#f';
		case 'if':
			if (l!=4)
				throw new Error('argument error: if expression accepts 3 arguments');
			var predicate = evalScheem(expr[1], env);
			if (predicate === '#t')
				return evalScheem(expr[2], env);
			if (predicate === '#f')
				return evalScheem(expr[3], env);
			throw new Error('argument error: predicate doesn\'t evaluate to bool \n' + expr[1]);
		case 'let-one':
			return evalScheem(expr[3], {
				name: expr[1],
				value: evalScheem(expr[2], env),
				outer: env
			});
		case 'let':
			for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
				add_binding(env, expr[1][i][0], evalScheem(expr[1][i][1]));
			}
			return evalScheem(expr[2], env);
		case 'lambda':
			return function () {
				for (var i = 0, ilen = expr[1].length; i < ilen; i++) {
					add_binding(env, expr[1][i], arguments[i]);
				}
				return evalScheem(expr[2], env);
			};
		case 'alert': 
			var res = evalScheem(expr[1], env);
			console.log(res);
			return res;
		case 'assert-args-0': 
      return expr.length === 1 ? '#t' : '#f';
    case 'assert-args-1': 
      return expr.length === 2 ? '#t' : '#f';
    case 'assert-args-2': 
      return expr.length === 3 ? '#t' : '#f';
		default:
			var func = evalScheem(expr[0], env);
			var args = [];
			for (var i = 1, ilen = expr.length; i < ilen; ++i) {
				args.push(evalScheem(expr[i], env));
			}
			return func.apply(null, args);
	}
};

var evalScheemString = function(expr, env){
	return evalScheem(parse(expr),env);
}

if (typeof module !== 'undefined') {
    module.exports.evalScheem = evalScheem;
		module.exports.evalScheemString = evalScheemString;	
		module.exports.add_binding = add_binding;
		module.exports.update = update;
		module.exports.lookup = lookup;
}