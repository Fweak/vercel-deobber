const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const parser = require('@babel/parser');
const t = require('@babel/types');
const vm = require('vm');
const fs = require('fs');
const virtual = vm.createContext();

let arrayCallName = '';
const FindFunctions = {
	// Finds functions declares, and sees if its using the array
	FunctionDeclaration(path) {
		if (!path.node.id?.name) return;

		const functionBody = path.node.body?.body[0];
		if (t.isCallExpression(functionBody.declarations[0].init)) {
			arrayCallName = path.node.id.name;
		}

		const code = generate(path.node).code;
		console.log('[+] Found Function (', path.node.id.name, ')..');
		const err = vm.runInContext(code, virtual);
		if (err) console.lo(err);
		path.remove();
	},
};

const ShifterFunction = {
	// Finds the shift array expression
	CallExpression(path) {
		if (!path.node.callee) return;
		if (!t.isFunctionExpression(path.node.callee)) return;
		if (!t.isForStatement(path.node.callee.body.body[0])) return;

		const code = generate(path.node).code;
		const err = vm.runInContext(`!${code}`, virtual);
		if (err != true) console.log(err);

		console.log('[+] Found Shifter Function..');
		path.remove();
	},
};

const ReplaceCallExpressions = {
	// replaces Math[x(12571)], globalThis[x(15125)]
	CallExpression(path) {
		if (t.isIdentifier(path.node.callee)) {
			const args = path.node.arguments.map((s) => s.value);
			const virt = vm.runInContext(
				`${arrayCallName}(${args})`,
				virtual
			);

			path.replaceWith(t.stringLiteral(virt));
		}
	},
	// removes var x = s;
	VariableDeclarator(path) {
		path.remove();
	},
};

const lolcat = require('./lolcat.json');
(() => {
	const parsedAi = JSON.parse(atob(lolcat.ai));
	const parse = parser.parse(`(${parsedAi.c})`);
	traverse(parse, FindFunctions);
	traverse(parse, ShifterFunction);
	traverse(parse, ReplaceCallExpressions);
	const code = generate(parse, {}).code;
	const sliced = code.slice(0, code.length - 1); // removes the semi-colon :uwu:

	fs.writeFileSync('./lolcat.js', `${sliced}(${parsedAi.a})`, {
		encoding: 'utf-8',
	});
})();
