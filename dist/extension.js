module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/extension.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/editor.ts":
/*!***********************!*\
  !*** ./src/editor.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceSingleExport = exports.listAppendToExport = exports.inlineAppendToExport = exports.addToExport = exports.newExportStatement = exports.getExportsType = void 0;
const vscode = __webpack_require__(/*! vscode */ "vscode");
// Get the line in the text where the module.exports resides
function getExportsLineInText(document) {
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
function getExportsType(document) {
    let result = '';
    for (let i = document.lineCount - 1; i >= 0; --i) {
        const sourceLine = document.lineAt(i).text;
        if (sourceLine && sourceLine.includes('module.exports')) {
            if (sourceLine.replace(/\s/g, '').includes('{}')) {
                result = 'empty';
            }
            else if (sourceLine.includes('}')) {
                result = 'inline';
            }
            else if (!sourceLine.includes('{') && !sourceLine.includes('}')) {
                result = 'single';
            }
            else if (!sourceLine.includes('}')) {
                result = 'list';
            }
        }
    }
    return result;
}
exports.getExportsType = getExportsType;
// Should be used when module.exports does not exist in the file
function newExportStatement(editor, functionNames) {
    if (!functionNames || functionNames.length === 0) {
        return;
    }
    const document = editor.document;
    return editor.edit(editBuilder => {
        const lastLine = document.lineAt(document.lineCount - 1).range.end;
        editBuilder.insert(lastLine, `\n\nmodule.exports = { ${functionNames.join(', ')} };`);
    });
}
exports.newExportStatement = newExportStatement;
// Should be used when module.exports = { }; exists in the file, but nothing is expoorted yet
function addToExport(editor, functionNames) {
    if (!functionNames || functionNames.length === 0) {
        return;
    }
    const document = editor.document;
    const { exportsLine } = getExportsLineInText(document);
    return editor.edit(editBuilder => {
        const start = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character - 2);
        const end = new vscode.Position(exportsLine, document.lineAt(exportsLine).range.end.character);
        editBuilder.replace(new vscode.Range(start, end), `${functionNames.join(', ')} };`);
    });
}
exports.addToExport = addToExport;
function inlineAppendToExport(editor, functionNames) {
    if (!functionNames || functionNames.length === 0) {
        return;
    }
    const document = editor.document;
    const { exportsLine, exportsText } = getExportsLineInText(document);
    // Possible optimization: go over the string one time symbol by symbol instead of a chain of methods that each go over a string
    const alreadExportedFunctions = exportsText.replace(/\s+/g, '').replace(/^module.exports={/, '').replace(/[};]/g, '').split(',').map(fn => fn.trim());
    const filteredNames = [];
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
exports.inlineAppendToExport = inlineAppendToExport;
function listAppendToExport(editor, functionNames) {
    if (!functionNames || functionNames.length === 0) {
        return;
    }
    const document = editor.document;
    const { exportsLine } = getExportsLineInText(document);
    // Find the end of the module.exports statement
    let endLine = -1;
    const alreadyExportedFunctions = [];
    for (let i = exportsLine; i < document.lineCount; ++i) {
        const sourceLine = document.lineAt(i).text;
        if (sourceLine && sourceLine.includes('}')) {
            endLine = i;
            break;
        }
        else {
            alreadyExportedFunctions.push(sourceLine.replace(/,/g, '').trim());
        }
    }
    const filteredNames = [];
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
exports.listAppendToExport = listAppendToExport;
function replaceSingleExport(editor, functionNames) {
    if (!functionNames || functionNames.length === 0) {
        return;
    }
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
exports.replaceSingleExport = replaceSingleExport;


/***/ }),

/***/ "./src/extension.ts":
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.exportAllFunctions = exports.exportFunctionUnderCursor = void 0;
const vscode = __webpack_require__(/*! vscode */ "vscode");
const modulesEditor = __webpack_require__(/*! ./editor */ "./src/editor.ts");
function exportFunctions(editor, functionNames) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = editor.document.getText();
        if (!text.includes('module.exports')) { // module.exports doesn't exist in the file
            yield modulesEditor.newExportStatement(editor, functionNames);
        }
        else {
            const exportsType = modulesEditor.getExportsType(editor.document);
            if (exportsType === 'empty') { // module.exports = { }; exists in the file 
                yield modulesEditor.addToExport(editor, functionNames);
            }
            else if (exportsType === 'inline') { // module.exports = { someFunctionName }; exists in the file
                yield modulesEditor.inlineAppendToExport(editor, functionNames);
            }
            else if (exportsType === 'single') { // module.exports = somename; exists in the file
                yield modulesEditor.replaceSingleExport(editor, functionNames);
            }
            else if (exportsType === 'list') { // module.exports statement expands multiple lines
                yield modulesEditor.listAppendToExport(editor, functionNames);
            }
        }
    });
}
function exportFunctionUnderCursor() {
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
exports.exportFunctionUnderCursor = exportFunctionUnderCursor;
function exportAllFunctions() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const functionNames = [];
        for (let i = 0; i < document.lineCount; ++i) {
            const sourceLine = document.lineAt(i).text;
            if (sourceLine && sourceLine.startsWith('function') || sourceLine.startsWith('async function')) {
                const match = sourceLine.replace(/async|function/g, '').match(/^[^(]*/);
                if (match) {
                    functionNames.push(match[0].trim());
                }
            }
        }
        return exportFunctions(editor, functionNames);
    }
}
exports.exportAllFunctions = exportAllFunctions;
function activate(context) {
    const underCursor = vscode.commands.registerCommand('module-exports.exportFunctionUnderCursor', exportFunctionUnderCursor);
    const all = vscode.commands.registerCommand('module-exports.exportAllFunctions', exportAllFunctions);
    context.subscriptions.push(underCursor);
    context.subscriptions.push(all);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("vscode");

/***/ })

/******/ });
//# sourceMappingURL=extension.js.map