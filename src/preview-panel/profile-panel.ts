import * as vscode from 'vscode';
import * as fs from 'fs'
import { STDFAnalyser } from 'stdf-analyser';
import { PreviewPanel } from ".";
import { RecordBase } from 'stdf-analyser/lib/record-define';

export default class ProfileViewPanel extends PreviewPanel {

	// private gridMIRData: any[] = [];

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
		const scriptUri = this.getResourceUri('grid/profile-view.js');
		const perspectiveUri = this.getResourceUri('grid/gridjs.umd.js');
		const styleMainUri = this.getResourceUri('grid/mermaid.min.css');

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<link href="${styleMainUri}" rel="stylesheet"/>
				<script type="text/javascript" src=${perspectiveUri}></script>
				<script type="text/javascript" src="${scriptUri}"></script>				
			</head>
			<body>
				<div>
					<button class="btn">BUTTON</button>
				</div>
				<div id="wrapper"></div>
				<h1>MIR</h1>
				<div id="MIR_GRID" width="90%" align="center"></div> 
				<h1>WIR</h1>
				<div id="WIR_GRID" width="90% align="center"></div> 
			</body>
			</html>
		`;
    }

	async onFile(path: string): Promise<void> {
		this.filePath = path;

		const analyser: STDFAnalyser = new STDFAnalyser({
			included: ['MIR', 'WIR']
		});

		const input = fs.createReadStream(this.filePath);

		for await (const chunk of input) {
			await analyser.analyseSync(<Buffer>chunk, (record) => {
				return this.onRecord(record);
			})
		}

		input.close();

		return Promise.resolve();
	}

	private onRecord(record: RecordBase): Promise<void> {
		switch(record.name) {
			case 'MIR':
				return this.onMIR(record);
			case 'WIR':
				return this.onWIR(record);
		}
		return Promise.resolve();
	}

	private onMIR(record: RecordBase): Promise<void> {
		const data = [];
		let t = [];
		for (const field of record.fields) {
			t.push(field.name);
			t.push(field.value || '-');
			if (t.length === 4) {
				data.push(t);
				t = []
			}
		}
		if (t.length > 0) {
			data.push(t);
		}
		this.updateComponentData('MIR_GRID', data);
		return Promise.resolve();
	}
	
	private onWIR(record: RecordBase): Promise<void> {
		const data = [];
		let t = [];
		for (const field of record.fields) {
			t.push(field.name);
			t.push(field.value || '-');
			if (t.length === 4) {
				data.push(t);
				t = []
			}
		}
		if (t.length > 0) {
			data.push(t);
		}
		this.updateComponentData('WIR_GRID', data);
		return Promise.resolve();
	}	
}

