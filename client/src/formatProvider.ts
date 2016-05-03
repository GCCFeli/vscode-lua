'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import {LuaFormatter} from './luaFormatter'

export class LuaFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
    private rootDir: string;
    private formatter: LuaFormatter;

    public constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.rootDir = context.asAbsolutePath(".");
        this.formatter = new LuaFormatter(outputChannel);
    }

    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        var fileDir = path.dirname(document.uri.fsPath);
        return this.formatter.formatDocument(document, options, token);
    }
}
