import * as vscode from 'vscode';
import { PreviewPanel } from ".";

export default class DetailViewPanel extends PreviewPanel {

    constructor(uri: vscode.Uri, column?: vscode.ViewColumn, status?: vscode.StatusBarItem) {
        super({
            uri: uri,
            name: 'DetailView',
            column: column || vscode.ViewColumn.One,
            type: 'detail.type',
            resourcePath: ['grid'],
			status: status
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

	onArg(arg: any): Promise<void> {
		throw new Error('Method not implemented.');
	}
}