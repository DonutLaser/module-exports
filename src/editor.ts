import * as vscode from 'vscode';

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
function newExportStatement(editor: vscode.TextEditor, functionNames: string[]) {
    if (!functionNames || functionNames.length === 0) { return; }

    const document = editor.document;
    editor.edit(editBuilder => {
        const lastLine = document.lineAt(document.lineCount - 1).range.end;
        editBuilder.insert(lastLine, `\n\nmodule.exports = { ${functionNames.join(', ')} };`);
    });
}

// Should be used when module.exports = { }; exists in the file, but nothing is expoorted yet
function addToExport(editor: vscode.TextEditor, functionNames: string[]) {
    if (!functionNames || functionNames.length === 0) { return; }

    const document = editor.document;
    const { exportsLine } = getExportsLineInText(document);
    editor.edit(editBuilder => {
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
        editor.edit(editBuilder => {
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
        editor.edit(editBuilder => {
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
            editor.edit(editBuilder => {
                const start = document.lineAt(exportsLine).range.start;
                const end = document.lineAt(exportsLine).range.end;

                editBuilder.replace(new vscode.Range(start, end), `module.exports = { ${exportedThing}, ${filteredNames.join(', ')} };`);
            });
        }
    }
}

export {
    getExportsType,
    newExportStatement,
    addToExport,
    inlineAppendToExport,
    listAppendToExport,
    replaceSingleExport,
};