var lookup = function(env, v){
	return env.name===v?env.value:lookup(env.outer, v);
}
var update = function(env,v,val){
	return env.name===v?env.value=val:update(env.outer, v, val);
}
var add_binding = function (env, v, val) {
    var name = env.name;
    var value = env.value;
    var outer = env.outer;
    env.name=v;
    env.value=val;
    env.outer={
        name:name,
        value:value,
        outer:outer
    };
};
var evalScheem = function (expr, env) {
	var l = expr.length;
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
			case 'lambda-one':
				return function(arg){
					return evalScheem(expr[2],{
						name: expr[1],
						value: arg,
						outer: env
					});
				};
			default:
				var func = evalScheem(expr[0],env);
				var arg = evalScheem(expr[1],env);
				return func(arg);
    }
};

if (typeof module !== 'undefined') {
    module.exports.evalScheem = evalScheem;
		module.exports.add_binding = add_binding;
		module.exports.update = update;
		module.exports.lookup = lookup;
}