import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STDFAnalyser } from 'stdf-analyser';
import { PreviewPanel, ProcessArgs } from ".";
import { RecordBase } from 'stdf-analyser/lib/record-define';

export default class ProfileViewPanel extends PreviewPanel {

	private processIncrement: number = 0;

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
		const gridStyle = this.getResourceUri('grid/component.css');
		const scriptUri = this.getResourceUri('grid/profile-view.js');
		const perspectiveUri = this.getResourceUri('grid/gridjs.umd.js');
		const styleMainUri = this.getResourceUri('grid/mermaid.min.css');

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<link href="${gridStyle}" rel="stylesheet"/>
				<link href="${styleMainUri}" rel="stylesheet"/>
				<script type="text/javascript" src=${perspectiveUri}></script>
				<script type="text/javascript" src="${scriptUri}"></script>				
			</head>
			<body>
				<div>
					<button class="btn">BUTTON</button>
				</div>
				<div width="100%">
				<div><h1>MIR</h1></div>
				<div class="grid_holder" id="WIR_GRID"></div> 
				<div><h1>WIR</h1></div>
				<div class="grid_holder" id="MIR_GRID"></div>
				</div>
			</body>
			</html>
		`;
    }

	async onFile(process: vscode.Progress<ProcessArgs>, filename: string): Promise<void> {
		this.filename = filename;

		this.viewPanel.title = path.basename(this.filename);

		process.report({
			increment: (this.processIncrement += 10),
			message: 'create STDF analyser...'
		});
		const analyser: STDFAnalyser = new STDFAnalyser({
			included: ['MIR', 'WIR']
		});

		process.report({
			increment: (this.processIncrement += 10),
			message: 'open STDF file...'
		});

		const input = fs.createReadStream(this.filename);

		for await (const chunk of input) {
			await analyser.analyseSync(<Buffer>chunk, (record) => {
				return this.onRecord(process, record);
			});
		}

		input.close();

		process.report({
			increment: 100,
			message: 'process end.'
		});

		return Promise.resolve();
	}

	private onRecord(process: vscode.Progress<ProcessArgs>, record: RecordBase): Promise<void> {

		process.report({
			increment: (this.processIncrement += 10),
			message: `analyse ${record.name} record..`
		});

		switch(record.name) {
			case 'MIR':
				this.onMIR(record);
				break;
			case 'WIR':
				this.onWIR(record);
				break;
		}
		return Promise.resolve();
	}

	private onMIR(record: RecordBase): void {
		const data = [];
		let t = [];
		for (const field of record.fields) {
			t.push(field.name);
			t.push(field.value || '-');
			if (t.length === 4) {
				data.push(t);
				t = [];
			}
		}
		if (t.length > 0) {
			data.push(t);
		}
		this.updateComponentData('MIR_GRID', data);
	}
	
	private onWIR(record: RecordBase): void {
		const data = [];
		let t = [];
		for (const field of record.fields) {
			t.push(field.name);
			t.push(field.value || '-');
			if (t.length === 4) {
				data.push(t);
				t = [];
			}
		}
		if (t.length > 0) {
			data.push(t);
		}
		this.updateComponentData('WIR_GRID', data);
	}	
}

