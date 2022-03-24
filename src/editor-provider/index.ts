import * as vscode from "vscode";
import { STDFDocument } from "./document";

export class STDFEditorProvider implements vscode.CustomReadonlyEditorProvider<STDFDocument> {
    public static readonly viewType = 'stdf.preview.editor';
    
    constructor(private readonly context: vscode.ExtensionContext) {
    }

    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): STDFDocument {
        return new STDFDocument(this.context, uri, openContext);
    }

    async resolveCustomEditor(document: STDFDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
		vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'STDF file analysing..',
            cancellable: true
        }, (process, token) => {
            token.onCancellationRequested((event) => {
                document.stopAnalyse();
            });
            return document.analyse(process, webviewPanel);
        });
    }
}