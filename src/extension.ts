import * as vscode from 'vscode';
import * as modulesEditor from './editor';

function getFunctionUnderCursor(editor: vscode.TextEditor) {
	let line = editor.selection.active.line;

	for (let i = line; i >= 0; --i) {
		const sourceLine = editor.document.lineAt(i).text;
		if (sourceLine && sourceLine.startsWith('function') || sourceLine.startsWith('async function')) {
			const match = sourceLine.replace(/async|function/g, '').match(/^[^(]*/);
			if (match) { return match[0].trim(); }
		}
	}

	return '';
}

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

async function exportFunctionExclusive(editor: vscode.TextEditor, functionName: string) {
	const text = editor.document.getText();
	if (!text.includes('module.exports')) {
		await modulesEditor.newExportStatement(editor, [functionName], true);
	} else {
		await modulesEditor.replaceExport(editor, functionName);
	}
}

export function clearAllExports() {
	const editor = vscode.window.activeTextEditor;

	if (editor) { return modulesEditor.clearExports(editor); }
}

export function exportFunctionUnderCursorExclusive() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const functionName = getFunctionUnderCursor(editor);
		return functionName !== '' ? exportFunctionExclusive(editor, functionName) : null;
	}
}

export function exportFunctionUnderCursor() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const functionName = getFunctionUnderCursor(editor);
		return functionName !== '' ? exportFunctions(editor, [functionName]) : null;
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

		return functionNames.length > 0 ? exportFunctions(editor, functionNames) : null;
	}
}

export function activate(context: vscode.ExtensionContext) {
	const underCursor = vscode.commands.registerCommand('module-exports.exportFunctionUnderCursor', exportFunctionUnderCursor);
	const all = vscode.commands.registerCommand('module-exports.exportAllFunctions', exportAllFunctions);
	const exclusive = vscode.commands.registerCommand('module-exports.exportFunctionUnderCursorExclusive', exportFunctionUnderCursorExclusive);
	const clear = vscode.commands.registerCommand('module-exports.clearAllExports', clearAllExports);
	context.subscriptions.push(underCursor);
	context.subscriptions.push(all);
	context.subscriptions.push(exclusive);
	context.subscriptions.push(clear);
}

export function deactivate() {

}