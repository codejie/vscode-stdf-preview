import * as vscode from 'vscode';

export class TestView {

    public static viewType: string = 'test.view';

    constructor(private panel: vscode.WebviewPanel | undefined, private readonly extensionUri: vscode.Uri, column: vscode.ViewColumn | undefined) {
        if (!this.panel) {
            this.panel = vscode.window.createWebviewPanel(
                TestView.viewType,
                'TEST.VIEW',
                column || vscode.ViewColumn.One,
                this.getWebViewOptions()
            );
        }

		this.panel.webview.onDidReceiveMessage((data) => {
			switch (data.type) {
				case 'colorSelected':
					{
						vscode.window.showInformationMessage(`${data.value}`);
						break;
					}
			}
		});

        this.panel.webview.html = this.getHtml();
    }

    getWebViewOptions(): (vscode.WebviewPanelOptions & vscode.WebviewOptions) | undefined {
        return {
            enableScripts: true,
            // localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")]
			localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "grid")]
        };
    }

    getHtml(): string {
        const webview = this.panel!.webview;
        // const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js'));
		// const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'reset.css'));
		// const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'vscode.css'));
		// const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.css'));

		// <link href="${styleResetUri}" rel="stylesheet">
		// <link href="${styleVSCodeUri}" rel="stylesheet">
		// <link href="${styleMainUri}" rel="stylesheet">
		
		// <title>Cat Colors</title>

		// const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'view', 'test.js'));
		// const perspectiveUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'view', 'perspective.js'));
		// const perspectiveViewerUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'view', 'perspective-viewer.js'));
		// const perspectiveDataUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'view', 'perspective-viewer-hypergrid.js'));
		// const perspectiveD3fcUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'view', 'perspective-viewer-d3fc.js'));
		// const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'view', 'material.css'));

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'grid', 'test.js'));
		const perspectiveUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'grid', 'gridjs.umd.js'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'grid', 'mermaid.min.css'));

		const nonce = getNonce();

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<link href="${styleMainUri}" rel="stylesheet"/>
			</head>
			<body>
				<div>
					<button class="btn">BUTTON</button>
				</div>
				<div id="wrapper"></div>
			
				<script src=${perspectiveUri}></script>
				<script type="text/javascript" src="${scriptUri}"></script>
			</body>
			</html>
		`;

		// return `<!DOCTYPE html>
		// 	<html lang="en">
		// 	<head>
		// 		<meta charset="UTF-8">

		// 		<!--
		// 			Use a content security policy to only allow loading images from https or from our extension directory,
		// 			and only allow scripts that have a specific nonce.
		// 			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
		// 		-->
		// 		<meta http-equiv="Content-Security-Policy" 
		// 			content="default-src * ${webview.cspSource} https: 'unsafe-inline' 'unsafe-eval';
		// 		  	script-src ${webview.cspSource} blob: data: https: 'unsafe-inline' 'unsafe-eval';
		// 		  	style-src ${webview.cspSource} https: 'unsafe-inline';
		// 		  	img-src ${webview.cspSource} data: https:;
		// 		  	connect-src ${webview.cspSource} blob: data: https: http:;">				

		// 		<meta name="viewport" content="width=device-width, initial-scale=1.0">

		// 		<title>Data Preview</title>
		// 		<script src="${perspectiveUri}"></script>
		// 		<script src="${perspectiveViewerUri}"></script>
		// 		<script src="${perspectiveDataUri}"></script>
		// 		<script src="${perspectiveD3fcUri}"></script>
		// 		<link href="${styleMainUri}" rel="stylesheet"/>				
		// 	</head>
		// 	<body>
		// 		<div>
		// 			<button class="btn">BUTTON</button>
		// 		</div>
		// 		<div>
		// 			<perspective-viewer id="data-viewer" editable="true" selectable="true"></perspective-viewer>				
		// 		</div>
		// 		<script type="text/javascript" src="${scriptUri}"></script>
		// 	</body>
		// 	</html>`;
    }

    get viewPanel(): vscode.WebviewPanel {
        return this.panel!;
    }
    
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
