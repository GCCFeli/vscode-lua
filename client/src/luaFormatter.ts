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
    public formatDocument(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        var luaFormatterPath = 'C:/Users/feli/AppData/Roaming/LuaRocks/bin/luaformatter.bat';
        var fileDir = path.dirname(document.uri.fsPath);
        return this.provideDocumentFormattingEdits(document, options, token, `${luaFormatterPath} -s 4 "${document.uri.fsPath}"`);
    }

    protected provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken, cmdLine: string): Thenable<vscode.TextEdit[]> {
        var fileDir = path.dirname(document.uri.fsPath);
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

                sendCommand(cmdLine, fileDir).then(data=> {
                    var formattedText = data;
                    if (document.getText() === formattedText) {
                        return resolve([]);
                    }

                    var range = new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end)
                    var txtEdit = new vscode.TextEdit(range, formattedText);
                    resolve([txtEdit]);

                }, errorMsg => {
                    vscode.window.showErrorMessage(`There was an error in formatting the document. View the Python output window for details.`);
                    this.outputChannel.appendLine(errorMsg);
                    return resolve([]);
                });
            });
        });
    }
}
