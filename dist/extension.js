module.exports=function(e){var t={};function n(o){if(t[o])return t[o].exports;var r=t[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}return n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(o,r,function(t){return e[t]}.bind(null,r));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t){e.exports=require("vscode")},function(e,t,n){"use strict";var o=this&&this.__awaiter||function(e,t,n,o){return new(n||(n=Promise))((function(r,i){function c(e){try{s(o.next(e))}catch(e){i(e)}}function u(e){try{s(o.throw(e))}catch(e){i(e)}}function s(e){var t;e.done?r(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(c,u)}s((o=o.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.deactivate=t.activate=t.exportAllFunctions=t.exportFunctionUnderCursor=void 0;const r=n(0),i=n(2);function c(e,t){return o(this,void 0,void 0,(function*(){if(e.document.getText().includes("module.exports")){const n=i.getExportsType(e.document);"empty"===n?yield i.addToExport(e,t):"inline"===n?yield i.inlineAppendToExport(e,t):"single"===n?yield i.replaceSingleExport(e,t):"list"===n&&(yield i.listAppendToExport(e,t))}else yield i.newExportStatement(e,t)}))}function u(){const e=r.window.activeTextEditor;if(e){let t="";for(let n=e.selection.active.line;n>=0;--n){const o=e.document.lineAt(n).text;if(o&&o.startsWith("function")||o.startsWith("async function")){const e=o.replace(/async|function/g,"").match(/^[^(]*/);if(e){t=e[0].trim();break}}}return c(e,[t])}}function s(){const e=r.window.activeTextEditor;if(e){const t=e.document,n=[];for(let e=0;e<t.lineCount;++e){const o=t.lineAt(e).text;if(o&&o.startsWith("function")||o.startsWith("async function")){const e=o.replace(/async|function/g,"").match(/^[^(]*/);e&&n.push(e[0].trim())}}return c(e,n)}}t.exportFunctionUnderCursor=u,t.exportAllFunctions=s,t.activate=function(e){const t=r.commands.registerCommand("module-exports.exportFunctionUnderCursor",u),n=r.commands.registerCommand("module-exports.exportAllFunctions",s);e.subscriptions.push(t),e.subscriptions.push(n)},t.deactivate=function(){}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.replaceSingleExport=t.listAppendToExport=t.inlineAppendToExport=t.addToExport=t.newExportStatement=t.getExportsType=void 0;const o=n(0);function r(e){let t=-1,n="";for(let o=e.lineCount-1;o>=0;--o){const r=e.lineAt(o).text;if(r&&r.includes("module.exports")){t=o,n=r;break}}return{exportsLine:t,exportsText:n}}t.getExportsType=function(e){let t="";for(let n=e.lineCount-1;n>=0;--n){const o=e.lineAt(n).text;o&&o.includes("module.exports")&&(o.replace(/\s/g,"").includes("{}")?t="empty":o.includes("}")?t="inline":o.includes("{")||o.includes("}")?o.includes("}")||(t="list"):t="single")}return t},t.newExportStatement=function(e,t){if(!t||0===t.length)return;const n=e.document;return e.edit(e=>{const o=n.lineAt(n.lineCount-1).range.end;e.insert(o,`\n\nmodule.exports = { ${t.join(", ")} };`)})},t.addToExport=function(e,t){if(!t||0===t.length)return;const n=e.document,{exportsLine:i}=r(n);return e.edit(e=>{const r=new o.Position(i,n.lineAt(i).range.end.character-2),c=new o.Position(i,n.lineAt(i).range.end.character);e.replace(new o.Range(r,c),t.join(", ")+" };")})},t.inlineAppendToExport=function(e,t){if(!t||0===t.length)return;const n=e.document,{exportsLine:i,exportsText:c}=r(n),u=c.replace(/\s+/g,"").replace(/^module.exports={/,"").replace(/[};]/g,"").split(",").map(e=>e.trim()),s=[];return t.forEach(e=>{u.includes(e)||s.push(e)}),s.length>0?e.edit(e=>{const t=new o.Position(i,n.lineAt(i).range.end.character-3),r=new o.Position(i,n.lineAt(i).range.end.character);e.replace(new o.Range(t,r),`, ${s.join(", ")} };`)}):void 0},t.listAppendToExport=function(e,t){if(!t||0===t.length)return;const n=e.document,{exportsLine:i}=r(n);let c=-1;const u=[];for(let e=i;e<n.lineCount;++e){const t=n.lineAt(e).text;if(t&&t.includes("}")){c=e;break}u.push(t.replace(/,/g,"").trim())}const s=[];return t.forEach(e=>{u.includes(e)||s.push(e)}),s.length>0?e.edit(e=>{if(!n.lineAt(c-1).text.includes(",")){const t=new o.Position(c-1,n.lineAt(c-1).range.end.character);e.replace(t,",")}const t=new o.Position(c,n.lineAt(c).range.end.character-2),r=new o.Position(c,n.lineAt(c).range.end.character);e.replace(new o.Range(t,r),`\t${s.join(",\n\t")},\n};`)}):void 0},t.replaceSingleExport=function(e,t){if(!t||0===t.length)return;const n=e.document,{exportsLine:i,exportsText:c}=r(n),u=c.replace(";","").match(/[^=]*$/);if(u){const r=u[0].trim(),c=t.filter(e=>e!==r);if(c.length>0)return e.edit(e=>{const t=n.lineAt(i).range.start,u=n.lineAt(i).range.end;e.replace(new o.Range(t,u),`module.exports = { ${r}, ${c.join(", ")} };`)})}}}]);
//# sourceMappingURL=extension.js.map