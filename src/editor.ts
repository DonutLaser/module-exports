import * as vscode from 'vscode';

function getExportedFunctions(document: vscode.TextDocument, exportsLine: number) {
    const result: string[] = [];
    for (let i = exportsLine + 1; i < document.lineCount; ++i) {
        const sourceLine = document.lineAt(i).text;
        if (sourceLine && sourceLine.includes('}')) {
            break;
        } else { result.push(sourceLine.replace(/,/g, '').trim()); }
    }

    return result;
}

function replaceModuleExports(editor: vscode.TextEditor, replaceWith: string) {
    const document = editor.document;
    const { exportsLine } = getExportsLineInText(document);

    const start = document.lineAt(exportsLine).range.start;
    const end = document.lineAt(document.lineCount - 1).range.end;

    return editor.edit(editBuilder => {
        editBuilder.replace(new vscode.Range(start, end), replaceWith);
    });
}

// Get the line in the text where the module.exports resides
function getExportsLineInText(document: vscode.TextDocument) {
    let resultIndex = -1;
    let resultText = '';
    for (let i = document.lineCount - 1; i >= 0; --i) {
        const sourceLine = document.lineAt(i).text;
        if (sourceLine && sourceLine.includes('module.exports')) {
            resultIndex = i;
            resultText = sourceLine;
            break;
        }
    }

    return { exportsLine: resultIndex, exportsText: resultText };
}

// Returns the type of the module.exports line.
// Types are:
//  empty -> module.exports = {};
//  inline -> module.exports = { something, somethingElse };
//  single -> module.exports = something;
//  list -> module.exports = {
//      something,
//      somethingElse,
//  }; 
function getExportsType(document: vscode.TextDocument) {
    let result = '';
    for (let i = document.lineCount - 1; i >= 0; --i) {
        const sourceLine = document.lineAt(i).text;
        if (sourceLine && sourceLine.includes('module.exports')) {
            if (sourceLine.replace(/\s/g, '').includes('{}')) {
                result = 'empty';
            } else if (sourceLine.includes('}')) {
                result = 'inline';
            } else if (!sourceLine.includes('{') && !sourceLine.includes('}')) {
                result = 'single';
            } else if (!sourceLine.includes('}')) {
                result = 'list';
            }
        }
    }

    return result;
}

// Should be used when module.exports does not exist in the file
function newExportStatement(editor: vscode.TextEditor, functionNames: string[], exclusive = false) {
    if (!functionNames || functionNames.length === 0) { return; }

    const document = editor.document;
    return editor.edit(editBuilder => {
        const lastLine = document.lineAt(document.lineCount - 1).range.end;
        let lineToInsert = '';
        if (exclusive && functionNames.length === 1) {
            lineToInsert = `\n\nmodule.exports = ${functionNames[0]};`;
        } else {
            lineToInsert = `\n\nmodule.exports = { ${functionNames.join(', ')} };`;
        }

        editBuilder.insert(lastLine, lineToInsert);
    });
}

// Should be used when module.exports = { }; exists in the file, but nothing is expoorted yet
function addToExport(editor: vscode.TextEditor, functionNames: string[]) {
    if (!functionNames || functionNames.length === 0) { return; }

    const document = editor.document;
    const { exportsLine } = getExportsLineInText(document);
    return editor.edit(editBuilder => {
        const start = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character - 2);
        const end = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character);

        editBuilder.replace(new vscode.Range(start, end), `${functionNames.join(', ')} };`);
    });
}

function inlineAppendToExport(editor: vscode.TextEditor, functionNames: string[]) {
    if (!functionNames || functionNames.length === 0) { return; }

    const document = editor.document;
    const { exportsLine, exportsText } = getExportsLineInText(document);

    // Possible optimization: go over the string one time symbol by symbol instead of a chain of methods that each go over a string
    const alreadExportedFunctions = exportsText.replace(/\s+/g, '').replace(/^module.exports={/, '').replace(/[};]/g, '').split(',').map(fn => fn.trim());
    const filteredNames: string[] = [];
    functionNames.forEach(name => {
        if (!alreadExportedFunctions.includes(name)) {
            filteredNames.push(name);
        }
    });

    if (filteredNames.length > 0) {
        return editor.edit(editBuilder => {
            const start = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character - 3);
            const end = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character);

            editBuilder.replace(new vscode.Range(start, end), `, ${filteredNames.join(', ')} };`);
        });
    }
}

function listAppendToExport(editor: vscode.TextEditor, functionNames: string[]) {
    if (!functionNames || functionNames.length === 0) { return; }

    const document = editor.document;
    const { exportsLine } = getExportsLineInText(document);

    // Find the end of the module.exports statement
    let endLine = -1;
    const alreadyExportedFunctions: string[] = [];
    for (let i = exportsLine; i < document.lineCount; ++i) {
        const sourceLine = document.lineAt(i).text;
        if (sourceLine && sourceLine.includes('}')) {
            endLine = i;
            break;
        } else { alreadyExportedFunctions.push(sourceLine.replace(/,/g, '').trim()); }
    }

    const filteredNames: string[] = [];
    functionNames.forEach(name => {
        if (!alreadyExportedFunctions.includes(name)) {
            filteredNames.push(name);
        }
    });

    if (filteredNames.length > 0) {
        return editor.edit(editBuilder => {
            // If the last export doesn't contain a comma, we should add one
            if (!document.lineAt(endLine - 1).text.includes(',')) {
                const start = new vscode.Position(endLine - 1, document.lineAt(endLine - 1).range.end.character);
                editBuilder.replace(start, ',');
            }

            const start = new vscode.Position(endLine, document.lineAt(endLine).range.end.character - 2);
            const end = new vscode.Position(endLine, document.lineAt(endLine).range.end.character);

            editBuilder.replace(new vscode.Range(start, end), `\t${filteredNames.join(',\n\t')},\n};`);
        });
    }
}

function replaceSingleExport(editor: vscode.TextEditor, functionNames: string[]) {
    if (!functionNames || functionNames.length === 0) { return; }

    const document = editor.document;
    const { exportsLine, exportsText } = getExportsLineInText(document);

    const match = exportsText.replace(';', '').match(/[^=]*$/);
    if (match) {
        const exportedThing = match[0].trim();
        const filteredNames = functionNames.filter(name => name !== exportedThing);

        if (filteredNames.length > 0) {
            return editor.edit(editBuilder => {
                const start = document.lineAt(exportsLine).range.start;
                const end = document.lineAt(exportsLine).range.end;

                editBuilder.replace(new vscode.Range(start, end), `module.exports = { ${exportedThing}, ${filteredNames.join(', ')} };`);
            });
        }
    }
}

function replaceExport(editor: vscode.TextEditor, functionName: string) {
    if (!functionName) { return; }
    return replaceModuleExports(editor, `module.exports = ${functionName};`);
}

function clearExports(editor: vscode.TextEditor) {
    return replaceModuleExports(editor, '');
}

function formatExportsInline(editor: vscode.TextEditor) {
    const document = editor.document;
    const { exportsLine } = getExportsLineInText(document);

    const exportsType = getExportsType(document);
    if (exportsType === 'list') {
        const functions = getExportedFunctions(document, exportsLine);
        if (functions.length > 0) {
            return replaceModuleExports(editor, `module.exports = { ${functions.join(', ')} };`);
        }
    }

    return;
}

function formatExportsList(editor: vscode.TextEditor) {
    const document = editor.document;
    const { exportsText } = getExportsLineInText(document);

    const exportsType = getExportsType(document);
    if (exportsType === 'inline') {
        const functions = exportsText.replace(/\s+/g, '').replace(/^module.exports={/, '').replace(/[};]/g, '').split(',').map(fn => fn.trim());
        if (functions.length > 0) {
            return replaceModuleExports(editor, `module.exports = {\n${functions.map(f => '\t' + f).join(',\n')},\n};`);
        }
    }

    return;
}

function cleanUnusedExports(editor: vscode.TextEditor, functionNames: string[]) {
    const document = editor.document;
    const { exportsLine, exportsText } = getExportsLineInText(document);

    const exportsType = getExportsType(document);
    if (exportsType === 'single') {
        const match = exportsText.replace(';', '').match(/[^=]*$/);
        if (match) {
            const exportedThing = match[0].trim();
            if (!functionNames.includes(exportedThing)) {
                return clearExports(editor);
            }
        }
    } else if (exportsType === 'inline') {
        const functions = exportsText.replace(/\s+/g, '').replace(/^module.exports={/, '').replace(/[};]/g, '').split(',').map(fn => fn.trim());
        if (functions.length > 0) {
            const usedFunctions: string[] = [];
            functions.forEach(f => {
                if (functionNames.includes(f)) {
                    usedFunctions.push(f);
                }
            });

            if (usedFunctions.length > 0) {
                return replaceModuleExports(editor, `module.exports = { ${usedFunctions.join(', ')} };`);
            }

            return replaceModuleExports(editor, '');
        }
    } else if (exportsType === 'list') {
        const functions = getExportedFunctions(document, exportsLine);
        if (functions.length > 0) {
            const usedFunctions: string[] = [];
            functions.forEach(f => {
                if (functionNames.includes(f)) {
                    usedFunctions.push(f);
                }
            });

            if (usedFunctions.length > 0) {
                return replaceModuleExports(editor, `module.exports = {\n${usedFunctions.map(f => '\t' + f).join(',\n')},\n};`);
            }

            return replaceModuleExports(editor, '');
        }
    }

    return;
}

function sortExports(editor: vscode.TextEditor) {
    const document = editor.document;
    const { exportsLine, exportsText } = getExportsLineInText(document);

    const exportsType = getExportsType(document);
    if (exportsType === 'list') {
        const functions = getExportedFunctions(document, exportsLine);
        if (functions.length > 0) {
            return replaceModuleExports(editor, `module.exports = {\n${functions.sort().map(f => '\t' + f).join(',\n')},\n};`);
        }
    } else if (exportsType === 'inline') {
        const functions = exportsText.replace(/\s+/g, '').replace(/^module.exports={/, '').replace(/[};]/g, '').split(',').map(fn => fn.trim());
        if (functions.length > 0) {
            return replaceModuleExports(editor, `module.exports = { ${functions.sort().join(', ')} };`);
        }
    }

    return;
}

export {
    getExportsType,
    newExportStatement,
    addToExport,
    inlineAppendToExport,
    listAppendToExport,
    replaceSingleExport,
    replaceExport,
    clearExports,
    formatExportsInline,
    formatExportsList,
    cleanUnusedExports,
    sortExports,
};