import * as vscode from 'vscode';
import { PreviewPanel } from ".";

export default class ProfileViewPanel extends PreviewPanel {
    constructor(uri: vscode.Uri, name?: string, column?: vscode.ViewColumn) {
        super({
            uri: uri,
            name: name || 'ProfileView',
            column: column || vscode.ViewColumn.One,
            type: 'profile_type',
            resourcePath: ['grid']
        });
    }

    getHtml(): string {
		const scriptUri = this.getResourceUri('grid/test.js');
		const perspectiveUri = this.getResourceUri('grid/gridjs.umd.js');
		const styleMainUri = this.getResourceUri('grid/mermaid.min.css');

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
    }
    
}