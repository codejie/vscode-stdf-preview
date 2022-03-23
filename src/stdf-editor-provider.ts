import * as vscode from "vscode";

class WebviewCollection {

	private readonly _webviews = new Set<{
		readonly resource: string;
		readonly webviewPanel: vscode.WebviewPanel;
	}>();

	/**
	 * Get all known webviews for a given uri.
	 */
	public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
		const key = uri.toString();
		for (const entry of this._webviews) {
			if (entry.resource === key) {
				yield entry.webviewPanel;
			}
		}
	}

	/**
	 * Add a new webview to the collection.
	 */
	public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
		const entry = { resource: uri.toString(), webviewPanel };
		this._webviews.add(entry);

		webviewPanel.onDidDispose(() => {
			this._webviews.delete(entry);
		});
	}
}

class STDFDocument extends vscode.Disposable implements vscode.CustomDocument {
    uri!: vscode.Uri;
}

export class STDFEditorProvider implements vscode.CustomReadonlyEditorProvider<STDFDocument> {
    public static readonly viewType = 'STDF.Preview.Editor';
    
    private readonly webviews = new WebviewCollection();
    constructor(private readonly context: vscode.ExtensionContext) {

    }

    async openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Promise<STDFDocument> {
		const document 
    }

    resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = this.getHtml(webviewPanel.webview);

		// webviewPanel.webview.onDidReceiveMessage(e => this.onMessage(document, e));

		this.webviews.add(document.uri, webviewPanel);
    }

    getHtml(webview: vscode.Webview): string {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'grid/view-panel.js'));
		const gridUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'grid/gridjs.umd.js'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'grid/mermaid.min.css'));

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<link href="${styleMainUri}" rel="stylesheet"/>
				<script type="text/javascript" src=${gridUri}></script>
				<script type="text/javascript" src="${scriptUri}"></script>				
			</head>
			<body>
				<div id="container" width="100%"/>
			</body>
			</html>
		`;
    }
}