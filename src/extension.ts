import * as vscode from 'vscode';

function exportFunctionUnderCursor() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const document = editor.document;
		let line = editor.selection.active.line;

		// Figure out a function name under the cursor
		let functionName = '';
		for (let i = line; i >= 0; --i) {
			const sourceLine = document.lineAt(i).text;
			if (sourceLine && sourceLine.startsWith('function') || sourceLine.startsWith('async function')) {
				const match = sourceLine.replace(/async|function/g, '').match(/^[^(]*/);
				if (match) {
					functionName = match[0].trim();
					break;
				}
			}
		}

		const text = document.getText();
		if (!text.includes('module.exports')) { // module.exports doesn't exist in the file
			editor.edit(editBuilder => {
				const lastLine = document.lineAt(document.lineCount - 1).range.end;
				editBuilder.insert(lastLine, `\n\nmodule.exports = { ${functionName} };`);
			});
		} else {
			let exportsLine = -1;
			let exportsSourceLine = '';
			for (let i = document.lineCount - 1; i >= 0; --i) {
				const sourceLine = document.lineAt(i).text;
				if (sourceLine && sourceLine.includes('module.exports')) {
					exportsLine = i;
					exportsSourceLine = sourceLine;
					break;
				}
			}

			if (exportsSourceLine.replace(/\s/g, '').includes('{}')) { // module.exports = { }; exists in the file 
				editor.edit(editBuilder => {
					const start = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character - 2);
					const end = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character);

					editBuilder.replace(new vscode.Range(start, end), `${functionName} };`);
				});
			} else if (exportsSourceLine.includes('}')) { // module.exports = { someFunctionName }; exists in the file
				editor.edit(editBuilder => {
					const start = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character - 3);
					const end = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character);

					editBuilder.replace(new vscode.Range(start, end), `, ${functionName} };`);
				});
			} else if (!exportsSourceLine.includes('{') && !exportsSourceLine.includes('}')) { // module.exports = somename; exists in the file
				editor.edit(editBuilder => {
					const match = exportsSourceLine.replace(';', '').match(/[^=]*$/); // Do not lose the thing that is already being exported
					if (match) {
						const exportedThing = match[0].trim();
						const start = document.lineAt(exportsLine).range.start;
						const end = document.lineAt(exportsLine).range.end;

						editBuilder.replace(new vscode.Range(start, end), `module.exports = { ${exportedThing}, ${functionName} };`);
					}
				});
			} else if (!exportsSourceLine.includes('}')) { // module.exports statement expands multiple lines
				// Find the end of the module.exports statement
				let endLine = -1;
				for (let i = exportsLine; i < document.lineCount; ++i) {
					const sourceLine = document.lineAt(i).text;
					if (sourceLine && sourceLine.includes('}')) {
						endLine = i;
						break;
					}
				}

				editor.edit(editBuilder => {
					// If the last export doesn't contain a comma, we should add one
					if (!document.lineAt(endLine - 1).text.includes(',')) {
						const start = new vscode.Position(endLine - 1, document.lineAt(endLine - 1).range.end.character);
						editBuilder.replace(start, ',');
					}

					const start = new vscode.Position(endLine, document.lineAt(endLine).range.end.character - 2);
					const end = new vscode.Position(endLine, document.lineAt(endLine).range.end.character);

					editBuilder.replace(new vscode.Range(start, end), `\t${functionName},\n};`);
				});
			}
		}
	}
}

function exportAllFunctions() {
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

		if (!document.getText().includes('module.exports')) {
			editor.edit(editBuilder => {
				const lastLine = document.lineAt(document.lineCount - 1).range.end;
				editBuilder.insert(lastLine, `\n\nmodule.exports = { ${functionNames.join(', ')} };`);
			});
		} else {
			let exportsLine = -1;
			let exportsSourceLine = '';
			for (let i = document.lineCount - 1; i >= 0; --i) {
				const sourceLine = document.lineAt(i).text;
				if (sourceLine && sourceLine.includes('module.exports')) {
					exportsLine = i;
					exportsSourceLine = sourceLine;
					break;
				}
			}

			if (exportsSourceLine.replace(/\s/g, '').includes('{}')) { // module.exports = { }; exists in the file 
				editor.edit(editBuilder => {
					const start = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character - 2);
					const end = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character);

					editBuilder.replace(new vscode.Range(start, end), ` ${functionNames.join(', ')} };`);
				});
			} else if (exportsSourceLine.includes('}')) { // module.exports = { someFunctionName }; exists in the file
				// editor.edit(editBuilder => {
				// 	const start = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character - 3);
				// 	const end = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character);

				// 	editBuilder.replace(new vscode.Range(start, end), `, ${functionName} };`);
				// });
			} else if (!exportsSourceLine.includes('{') && !exportsSourceLine.includes('}')) { // module.exports = somename; exists in the file
				// editor.edit(editBuilder => {
				// 	const match = exportsSourceLine.replace(';', '').match(/[^=]*$/); // Do not lose the thing that is already being exported
				// 	if (match) {
				// 		const exportedThing = match[0].trim();
				// 		const start = document.lineAt(exportsLine).range.start;
				// 		const end = document.lineAt(exportsLine).range.end;

				// 		editBuilder.replace(new vscode.Range(start, end), `module.exports = { ${exportedThing}, ${functionName} };`);
				// 	}
				// });
			} else if (!exportsSourceLine.includes('}')) { // module.exports statement expands multiple lines
				// Find the end of the module.exports statement
				// let endLine = -1;
				// for (let i = exportsLine; i < document.lineCount; ++i) {
				// 	const sourceLine = document.lineAt(i).text;
				// 	if (sourceLine && sourceLine.includes('}')) {
				// 		endLine = i;
				// 		break;
				// 	}
				// }

				// editor.edit(editBuilder => {
				// 	// If the last export doesn't contain a comma, we should add one
				// 	if (!document.lineAt(endLine - 1).text.includes(',')) {
				// 		const start = new vscode.Position(endLine - 1, document.lineAt(endLine - 1).range.end.character);
				// 		editBuilder.replace(start, ',');
				// 	}

				// 	const start = new vscode.Position(endLine, document.lineAt(endLine).range.end.character - 2);
				// 	const end = new vscode.Position(endLine, document.lineAt(endLine).range.end.character);

				// 	editBuilder.replace(new vscode.Range(start, end), `\t${functionName},\n};`);
				// });
			}
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	const underCursor = vscode.commands.registerCommand('module-exports.exportFunctionUnderCursor', exportFunctionUnderCursor);
	const all = vscode.commands.registerCommand('module-exports.exportAllFunctions', exportAllFunctions);
	context.subscriptions.push(underCursor);
}

export function deactivate() { }