import path = require('path');
import * as vscode from 'vscode';
import { Template } from './view-template';

// export class DataPreviewSerializer implements vscode.WebviewPanelSerializer {


//     deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: unknown): Thenable<void> {

//     }

// }

export class DataPriview {

    initWebview(type: string, column: vscode.ViewColumn, panel: vscode.WebviewPanel | undefined, template: Template): vscode.WebviewPanel {
        if (!panel) {
            const options = {
                enableScripts: true,
                enableCommandUris: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(__dirname, './assets/styles')),
                    vscode.Uri.file(path.join(__dirname, './assets/scripts'))
                ]
            }
            panel = vscode.window.createWebviewPanel(type, 'STDF View Panel', column, options);
        }
        return panel;
    }
}