'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {sendCommand} from './childProc';

interface FormattedCode {
    Text: string;
}

export class LuaFormatter {
    protected outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }
    public formatDocument(extensionDir: string, document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        var exeDir = path.join(extensionDir, "bin");
        var luaFormatExePath = path.join(exeDir, "LuaFormat.exe");
        
        return this.provideDocumentFormattingEdits(document, options, token, exeDir, `"${luaFormatExePath}" -i "${document.uri.fsPath}"`);
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
                    
                    let result: FormattedCode;
                    try {
                        result = JSON.parse(data);
                    }
                    catch (e) {
                        // not json
                        return resolve([]);
                    }

                    var range = new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end)
                    var textEdit = new vscode.TextEdit(range, result.Text);
                    resolve([textEdit]);
                }, errorMsg => {
                    vscode.window.showErrorMessage(`There was an error in formatting the document. View the Lua output window for details.`);
                    this.outputChannel.appendLine(errorMsg);
                    return resolve([]);
                });
            });
        });
    }
}
