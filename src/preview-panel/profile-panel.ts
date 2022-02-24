import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STDFAnalyser, Record } from 'stdf-analyser';
import { PreviewPanel, ProcessArgs } from ".";

export default class ProfileViewPanel extends PreviewPanel {

	private processIncrement: number = 0;

    constructor(uri: vscode.Uri, column: vscode.ViewColumn, status: vscode.StatusBarItem) {
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
		const gridStyle = this.getResourceUri('grid/components.css');
		const commonScript = this.getResourceUri('grid/common.js')
		const scriptUri = this.getResourceUri('grid/profile-view.js');
		const gridUri = this.getResourceUri('grid/gridjs.umd.js');
		const styleMainUri = this.getResourceUri('grid/mermaid.min.css');

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<link href="${gridStyle}" rel="stylesheet"/>
				<link href="${styleMainUri}" rel="stylesheet"/>
				<script type="text/javascript" src=${commonScript}></script>
				<script type="text/javascript" src=${gridUri}></script>
				<script type="text/javascript" src="${scriptUri}"></script>				
			</head>
			<body>
				<div>
					<button class="btn">BUTTON</button>
				</div>
				<div id="container" width="100%">
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
			// included: ['MIR', 'WIR', 'PTR']
			// included: ['SDR'],
			excluded: ['PTR', 'FTR', 'PIR', 'PRR', 'PMR', 'SBR', 'HBR', 'PGR', 'TSR']
		});

		process.report({
			increment: (this.processIncrement += 10),
			message: 'open STDF file...'
		});

		const input = fs.createReadStream(this.filename);

		for await (const chunk of input) {
			await analyser.analyseSync(<Buffer>chunk, (record) => {
				if (this.running) {
					return this.onRecord(process, record);
				} else {
					return Promise.reject();
				}
			});
		}

		input.close();

		process.report({
			increment: 100,
			message: 'process end.'
		});

		return Promise.resolve();
	}

	private onRecord(process: vscode.Progress<ProcessArgs>, record: Record.RecordBase): Promise<void> {

		process.report({
			increment: (this.processIncrement += 10),
			message: `analyse ${record.name} record..`
		});

		this.defaultRecord(record);

		// switch(record.name) {
		// 	case 'MIR':
		// 		this.onMIR(record);
		// 		break;
		// 	case 'WIR':
		// 		this.onWIR(record);
		// 		break;
		// 	default:
		// 		this.defaultRecord(record);
		// }
		return Promise.resolve();
	}

	private defaultRecord(record: Record.RecordBase): void {
		this.updateComponentRecord(record.name, record.desc || '');
		const data = {
			columns: this.makeGridColumns(record),
			data: this.makeGridData(record)
		};
		this.updateComponentConfig(`${record.name}_GRID`, data);
	}

	private onMIR(record: Record.RecordBase): void {
		this.updateComponentRecord(record.name, record.desc || '');
		const data = {
			columns: this.makeGridColumns(record),
			data: this.makeGridData(record)
		};
		this.updateComponentConfig('MIR_GRID', data);
		// this.updateComponentData('MIR_GRID', data);
	}
	
	private onWIR(record: Record.RecordBase): void {
		this.updateComponentRecord(record.name, record.desc || '');
		const data = {
			columns: this.makeGridColumns(record),
			data: this.makeGridData(record)
		};
		this.updateComponentConfig('WIR_GRID', data);
		// this.updateComponentData('WIR_GRID', data);
	}

	private makeGridColumns(record: Record.RecordBase): any {
		const showDesc = this.configuration.showDescription;
		if (!showDesc) {
			return ['Item', 'Value', 'Item', 'Value'];
		} else {
			return ['Item', 'Value', 'Description'];
		}
	}

	private makeGridData(record: Record.RecordBase): any {
		const showDesc = this.configuration.showDescription;
		const notMissing = this.configuration.notShowMissingField;
		const ret = [];

		if (!showDesc) {
			let t = [];
			for (const field of record.fields) {
				if (notMissing && field.value === undefined) {
					continue;
				}

				t.push(field.name);
				t.push(field.toValueNotes());
				if (t.length === 4) {
					ret.push(t);
					t = [];
				}
			}
			if (t.length > 0) {
				ret.push(t);
			}			
		} else {
			for (const field of record.fields) {
				if (notMissing && field.value === undefined) {
					continue;
				}
				ret.push([field.name, field.toValueNotes(), field.desc]);
			}
		}

		return ret;
	}
}

