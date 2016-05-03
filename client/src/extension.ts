/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

import {LuaFormattingEditProvider} from './formatProvider';

const LUA: vscode.DocumentFilter = { language: 'lua', scheme: 'file' }

export function activate(context: vscode.ExtensionContext) {

	// The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
	// The debug options for the server
	let debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
	
	// If the extension is launch in debug mode the debug server options are use
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run : { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}
	
	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: ['lua'],
		synchronize: {
			// Synchronize the setting section 'languageServerExample' to the server
			configurationSection: 'languageServerExample',
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	}
	
	// Create the language client and start the client.
	let disposable = new LanguageClient('Language Server Example', serverOptions, clientOptions).start();
	
	// Push the disposable to the context's subscriptions so that the 
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);
	
	let outChannel = vscode.window.createOutputChannel('Lua');
	outChannel.clear();
	
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(LUA, new LuaFormattingEditProvider(context, outChannel)));
}
