if (typeof module !== 'undefined'){
	var SCHEEM = require('./parser').SCHEEM;
	var parse = SCHEEM.parse;
}
var interpreter = function(){
	var lookup = function (env, v) {
		if (env === null) {
			throw new Error('function ' + v + ' not found');
		}
		return (!!env && env.hasOwnProperty('name')) ?
			(env.name === v ? env.value : lookup(env.outer, v)) :
			lookup(initial_env, v);
	};

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
				'+': function () { 
					var sum = 0;
					for (var i=0, l=arguments.length; i<l; i++)
						sum += evalScheem(arguments[i], env);
					if (isNaN(sum))
						throw new Error("type error: addition is defined for numbers only");
					return sum;
				},
				'-': function () {
					var sub = evalScheem(arguments[0], env);
					for (var i=1, l=arguments.length; i<l; i++)
						sub -= evalScheem(arguments[i], env);
					if(arguments.length === 1)
						sub = -sub;
					if (isNaN(sub))
						throw new Error("type error: subtraction is defined for numbers only");
					return sub;
				},
				'*': function () {
					var prod = 1;
					for (var i=0, l=arguments.length; i<l; i++)
						prod *= evalScheem(arguments[i], env);
					if (isNaN(prod))
						throw new Error("type error: multiplication is defined for numbers only");
					return prod;
				},
				'/': function () {
					var div = evalScheem(arguments[0], env);
					for (var i=1, l=arguments.length; i<l; i++)
						div /=evalScheem(arguments[i], env);
					if (isNaN(div))
						throw new Error("type error: division is defined for numbers only");
					return div;
				},
				'=': function (x, y) { 
					return (x === y)?'#t':'#f';
				},
				'>': function (x, y) { 
					return x>y?'#t':'#f';
				},
				'<': function (x, y) { 
					return x<y?'#t':'#f';
				},
				'<=>': function (x, y) { 
					return x < y ? -1 : (x === y ? 0 : 1); 
				},
				'cons': function (x, y) { 
					return [x].concat(y); 
				},
				'car': function (x) { 
					return x[0]; 
				},
				'cdr': function (x) { 
					return x.slice(1); 
				},
				'alert': function (x) { 
					console.log(x); 
					return x; 
				},
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
        if (env === null) {
          env = {name: expr[1],
                 value: evalScheem(expr[2]),
                 outer: null};
        } else if (env === {}) {
          env.name = expr[1];
          env.value = evalScheem(expr[2]);
          env.outer = null;
        } else {
          add_binding(env, expr[1], evalScheem(expr[2], env));
        }
        return 0;
			case 'begin':
				var res;
				for (var i=1;i<expr.length;i++)
					res=evalScheem(expr[i], env);
				return res;
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
	return {
		evalScheem:evalScheem,
		evalScheemString:evalScheemString,
		lookup:lookup,
		update:update,
		add_binding:add_binding
	}
}();
evalScheem = interpreter.evalScheem;
evalScheemString = interpreter.evalScheemString;
lookup = interpreter.lookup;
update = interpreter.update;
add_binding = interpreter.add_binding;
if (typeof module !== 'undefined') {
    module.exports.evalScheem = interpreter.evalScheem;
		module.exports.evalScheemString = interpreter.evalScheemString;
		module.exports.lookup = interpreter.lookup;
		module.exports.update = interpreter.update;
		module.exports.add_binding = interpreter.add_binding;
}