'use strict';

import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';

interface ErrorMessage {
    Error: string;
}

export function sendCommand(commandLine: string, cwd: string, includeErrorAsResponse:boolean = false): Promise<string> {
    return new Promise<string>((resolve, reject) => {

        child_process.exec(commandLine, { cwd: cwd }, (error, stdout, stderr) => {
            if (includeErrorAsResponse){
                return resolve(stdout + '\n' + stderr);
            }
            
            var hasErrors = (error && error.message.length > 0) || (stderr && stderr.length > 0);
            if (hasErrors && (typeof stdout !== "string" || stdout.length === 0)) {
                var errorMsg = stderr ? stderr + '' : error.message;
                
                if (stderr && stderr.length > 0) {
                    let err: ErrorMessage;
                    try {
                        err = JSON.parse(stderr);
                    }
                    catch (e) {
                        return reject("Unknown error: \n" + stderr);
                    }
                    return reject(err.Error);
                } else {
                    return reject(error.message);
                }
            }

            resolve(stdout + '');
        });
    });
}
