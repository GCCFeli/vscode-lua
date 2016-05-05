'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {sendCommand} from './childProc';

export class LuaFormatter {
    protected outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }
    public formatDocument(extensionDir: string, document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        var luaDir = path.join(extensionDir, "lua");
        var luaExePath = path.join(luaDir, "bin", "lua5.1.exe");
        var luaFormatterPath = path.join(luaDir, "luaformatter.lua");
        return this.provideDocumentFormattingEdits(document, options, token, luaDir, `"${luaExePath}" "${luaFormatterPath}" -s 4 "${document.uri.fsPath}"`);
    }

    protected provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken, cwd:string, cmdLine: string): Thenable<vscode.TextEdit[]> {
        return new Promise<vscode.TextEdit[]>((resolve, reject) => {
            //Todo: Save the contents of the file to a temporary file and format that instead saving the actual file
            //This could unnecessarily trigger other behaviours
            document.save().then(saved=> {
                var filePath = document.uri.fsPath;
                if (!fs.existsSync(filePath)) {
                    vscode.window.showErrorMessage(`File ${filePath} does not exist`)
                    return resolve([]);
                }

                this.outputChannel.clear();

                sendCommand(cmdLine, cwd).then(data=> {
                    var formattedText = data;
                    if (document.getText() === formattedText) {
                        return resolve([]);
                    }

                    var range = new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end)
                    var txtEdit = new vscode.TextEdit(range, formattedText);
                    resolve([txtEdit]);

                }, errorMsg => {
                    vscode.window.showErrorMessage(`There was an error in formatting the document. View the Lua output window for details.`);
                    this.outputChannel.appendLine(errorMsg);
                    return resolve([]);
                });
            });
        });
    }
}
