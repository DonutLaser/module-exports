import * as vscode from 'vscode';
import * as modulesEditor from './editor';

async function exportFunctions(editor: vscode.TextEditor, functionNames: string[]) {
	const text = editor.document.getText();
	if (!text.includes('module.exports')) { // module.exports doesn't exist in the file
		await modulesEditor.newExportStatement(editor, functionNames);
	} else {
		const exportsType = modulesEditor.getExportsType(editor.document);

		if (exportsType === 'empty') { // module.exports = { }; exists in the file 
			await modulesEditor.addToExport(editor, functionNames);
		} else if (exportsType === 'inline') { // module.exports = { someFunctionName }; exists in the file
			await modulesEditor.inlineAppendToExport(editor, functionNames);
		} else if (exportsType === 'single') { // module.exports = somename; exists in the file
			await modulesEditor.replaceSingleExport(editor, functionNames);
		} else if (exportsType === 'list') { // module.exports statement expands multiple lines
			await modulesEditor.listAppendToExport(editor, functionNames);
		}
	}
}

export function exportFunctionUnderCursor() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		let line = editor.selection.active.line;

		// Figure out a function name under the cursor
		let functionName = '';
		for (let i = line; i >= 0; --i) {
			const sourceLine = editor.document.lineAt(i).text;
			if (sourceLine && sourceLine.startsWith('function') || sourceLine.startsWith('async function')) {
				const match = sourceLine.replace(/async|function/g, '').match(/^[^(]*/);
				if (match) {
					functionName = match[0].trim();
					break;
				}
			}
		}

		return exportFunctions(editor, [functionName]);
	}
}

export function exportAllFunctions() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const document = editor.document;
		const functionNames: string[] = [];
		for (let i = 0; i < document.lineCount; ++i) {
			const sourceLine = document.lineAt(i).text;
			if (sourceLine && sourceLine.startsWith('function') || sourceLine.startsWith('async function')) {
				const match = sourceLine.replace(/async|function/g, '').match(/^[^(]*/);
				if (match) { functionNames.push(match[0].trim()); }
			}
		}

		return exportFunctions(editor, functionNames);
	}
}

export function activate(context: vscode.ExtensionContext) {
	const underCursor = vscode.commands.registerCommand('module-exports.exportFunctionUnderCursor', exportFunctionUnderCursor);
	const all = vscode.commands.registerCommand('module-exports.exportAllFunctions', exportAllFunctions);
	context.subscriptions.push(underCursor);
	context.subscriptions.push(all);
}

export function deactivate() { }