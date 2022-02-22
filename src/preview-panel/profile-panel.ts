import * as vscode from 'vscode';
import * as fs from 'fs'
import { STDFAnalyser } from 'stdf-analyser';
import { PreviewPanel } from ".";
import { RecordBase } from 'stdf-analyser/lib/record-define';

export default class ProfileViewPanel extends PreviewPanel {

    constructor(uri: vscode.Uri, column?: vscode.ViewColumn, status?: vscode.StatusBarItem) {
        super({
            uri: uri,
            name: 'ProfileView',
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

	async onFile(path: string): Promise<void> {
		const analyser: STDFAnalyser = new STDFAnalyser({
			included: ['MIR']
		});

		const input = fs.createReadStream(path);

		for await (const chunk of input) {
			await analyser.analyseSync(<Buffer>chunk, (record) => {
				return this.onRecord(record);
			})
		}

		return Promise.resolve();
	}

	onRecord(record: RecordBase): Promise<void> {
		switch(record.name) {
			case 'MIR':
				return this.onMIR(record)
		}
		return Promise.resolve();
	}

	onMIR(record: RecordBase): Promise<void> {
		this.viewPanel.webview.postMessage({
			command: 'data',
			data: ['1','2']
		});
		return Promise.resolve();
		// record.fields
		// throw new Error('Function not implemented.');
	}	
}

