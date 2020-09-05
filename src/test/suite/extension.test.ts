import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as path from 'path';
import * as myExtension from '../../extension';

async function createTestFile() {
	const newFile = vscode.Uri.parse('untitled:' + path.join('.', 'untitled.js'));
	await vscode.workspace.openTextDocument(newFile);
}

async function setupText(body: string, cursorLine: number) {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const start = editor.document.lineAt(0).range.start;
		await editor.edit(editBuilder => {
			editBuilder.insert(start, body);
		});

		editor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(cursorLine, 0));
	}
}

async function clearText() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const start = editor.document.lineAt(0).range.start;
		const end = editor.document.lineAt(editor.document.lineCount - 1).range.end;
		await editor.edit(editBuilder => {
			editBuilder.replace(new vscode.Range(start, end), '');
		});
	}
}

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
	suiteSetup(async () => {
		await createTestFile();
	});

	test('Export a single function when module.exports does\'t exist in the file', async () => {
		await setupText('async function start() {\n\n}\n\nfunction end() {\n\tconsole.log("hello world");\n}\n\nfunction testing() { }\n', 6);

		await myExtension.exportFunctionUnderCursor();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = { end };'), true);
		}

		await clearText();
	});

	test('Export a single function when module.exports exists but nothing is exported yet', async () => {
		await setupText('async function start() {\n\n}\n\nfunction end() {\n\tconsole.log("Hello world!");\n}\n\nfunction testing() {}\n\nmodule.exports = { };', 6);

		await myExtension.exportFunctionUnderCursor();

		const editor = vscode.window.activeTextEditor!;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = { end };'), true);
		}

		await clearText();
	});

	test('Export a single function when module.exports exists and already exports something inline', async () => {
		await setupText('async function start() {\n\n}\n\nfunction end() {\n\n}\n\nmodule.exports = { end };', 0);

		await myExtension.exportFunctionUnderCursor();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = { end, start };'), true);
		}

		await clearText();
	});

	test('Export a single function when module.exports a single function already', async () => {
		await setupText('async function start() {\n\n}\n\nfunction end() {\n\n}\n\nmodule.exports = end;', 0);

		await myExtension.exportFunctionUnderCursor();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = { end, start };'), true);
		}

		await clearText();
	});

	test('Export a single function when module.exports already exports something in a list', async () => {
		await setupText('async function start() {\n\n}\n\nfunction end() {\n\n}\n\nfunction test() {\n\tconsole.log("Hello");\n}\n\nmodule.exports = {\n\tend,\n\ttest,\n};', 0);

		await myExtension.exportFunctionUnderCursor();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.replace(/\s/g, '').includes('module.exports={end,test,start,};'), true);
		}

		await clearText();
	});

	test('Doesn\'t export the function when it already is exported', async () => {
		await setupText('async function start() {\n\n}\n\nmodule.exports = { start };', 0);

		await myExtension.exportFunctionUnderCursor();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = { start, start };'), false);
		}
	});

	test('Exports all functions successfully', async () => {
		await setupText('async function start() {\n\n}\n\nfunction end() {\n\n}\n\nfunction test() {\n\n}', 0);

		await myExtension.exportAllFunctions();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = { start, end, test };'), true);
		}
	});

	test('Exports a function exclusively when module.exports doesn\'t exist in the file', async () => {
		await setupText('function start() {\n\n}', 0);

		await myExtension.exportFunctionUnderCursorExclusive();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = start;'), true);
		}
	});

	test('Exports a function exclusively when module.exports = {}; exists in the file', async () => {
		await setupText('function start() {\n\n}\n\nmodule.exports = {};', 0);

		await myExtension.exportFunctionUnderCursorExclusive();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = start;'), true);
		}
	});

	test('Exports a function exclusively when module.exports = {}; exists in the file and something is already exported inline', async () => {
		await setupText('function start() {\n\n}\n\nfunction end() {\n\n}\n\nmodule.exports = { end };', 0);

		await myExtension.exportFunctionUnderCursorExclusive();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = start;'), true);
		}
	});

	test('Exports a function exclusively when something is already exclusively exported', async () => {
		await setupText('function start() {\n\n}\n\nfunction end() {\n\n}\n\nmodule.exports = end;', 0);

		await myExtension.exportFunctionUnderCursorExclusive();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = start;'), true);
		}
	});

	test('Exports a function exclusively when a list of functions is already exported', async () => {
		await setupText('function start() {\n\n}\n\nfunction end() {\n\n}\n\nfunction temp() {\n\n}\n\nmodule.exports = {\n\tend,\n\ttemp\n}', 0);

		await myExtension.exportFunctionUnderCursorExclusive();

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const text = editor.document.getText();
			assert.equal(text.includes('module.exports = start;'), true);
		}
	});
});
