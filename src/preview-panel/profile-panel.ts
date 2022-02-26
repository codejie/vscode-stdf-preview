import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STDFAnalyser, Record } from 'stdf-analyser';
import { PreviewPanel, ProcessArgs } from ".";

interface WaferInfoStruct {
	waferId?: string,
	partType?: string,
	lotId?: string,
	subLotId?: string,
	total?: number,
	pass?: number,
	jobName?: string,
	start?: Date,
	finish?: Date	
}

// interface TestNumberData {
// 	type: string,
// 	number: number,
// 	name: string,
// 	count: number,
// 	fail: number,
// 	min: number,
// 	max: number,
// 	avg: number
// }

interface DataStruct {
	name: string,
	value?: string
}

// interface TestNumberStruct {
// 	number: number,
// 	name: string,
// 	data: DataStruct[]
// }

const WaferInfoFields = ['WaferId', 'ProductId', 'LotId', 'subLotId',
	'PartTotal', 'PartPass', 'JobName', 'start', 'finish'];

const TestNumberDataFields = ['Type', 'Number', 'Name', 'Count', 'Fail', 'Min', 'Max', 'Avg'];

export default class ProfileViewPanel extends PreviewPanel {

	private processIncrement: number = 0;

	private waferInfo: WaferInfoStruct = {};
	private testNumberData: DataStruct[][] = [];

    constructor(uri: vscode.Uri, column: vscode.ViewColumn, status: vscode.StatusBarItem) {
        super({
            uri: uri,
            name: 'ProfileView',
            column: column || vscode.ViewColumn.One,
            type: 'profile.type',
            resourcePath: ['grid'],
			status: status
        });
    }

	// initDataStructs() {
	// 	WaferInfoFields.forEach(element => {
	// 		this.waferInfo.push({
	// 			name: element
	// 		});
	// 	});
	// }

    getHtml(): string {
		const gridStyle = this.getResourceUri('grid/components.css');
		const commonScript = this.getResourceUri('grid/common.js');
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
			included: ['MIR', 'WIR', 'WRR', 'TSR']
		});

		process.report({
			increment: (this.processIncrement += 10),
			message: 'open STDF file...'
		});

		const input = fs.createReadStream(this.filename);

		for await (const chunk of input) {
			if (!this.running) {
				break;
			}
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

	private onRecord(process: vscode.Progress<ProcessArgs>, record: Record.RecordBase): Promise<void> {

		process.report({
			increment: (this.processIncrement += 10),
			message: ` ${record.name} record ..`
		});

		switch(record.name) {
			case 'MIR':
				this.onMIR(record);
				break;
			case 'WIR':
				this.onWIR(record);
				break;
			case 'WRR':
				this.onWRR(record);
				break;
			case 'TSR':
				this.onTSR(record);
				break;									
			default:
				this.defaultRecord(record);
		}

		return Promise.resolve();
	}

	private defaultRecord(record: Record.RecordBase): void {
		const id = `${record.name}_GRID`;
		const title = `<font size="6pt">${record.name}</font>&nbsp;&nbsp;<font size="4pt">(${record.desc})</font>`;
		this.updateComponentRecord(id, title);
		const data = {
			columns: this.makeGridColumns(record),
			data: this.makeGridData(record)
		};
		this.updateComponentConfig(id, data);
	}
// ['WaferId', 'ProductId', 'LotId', 'subLotId',
// 	'PartTotal', 'PartPass', 'JobName', 'start', 'finish'];
	private onMIR(record: Record.RecordBase): void {
		this.waferInfo.lotId = record.fields[8].value;
		this.waferInfo.partType = record.fields[9].value;
		this.waferInfo.subLotId = record.fields[14].value;
		this.waferInfo.jobName = record.fields[12].value;
	}
	
	private onWIR(record: Record.RecordBase): void {
		this.waferInfo.waferId = record.fields[3].value;
		this.waferInfo.start = record.fields[2].value;
	}

	private onWRR(record: Record.RecordBase): void {
		this.waferInfo.finish = record.fields[2].value;
		this.waferInfo.total = record.fields[3].value;
		this.waferInfo.pass = record.fields[6].value;

		this.makeWaferComponent();
		// this.makeWaferInfoData();
	}
	
	private onTSR(record: Record.RecordBase): void {
		
	}

	private makeWaferComponent() {
		this.updateComponentRecord('wafer_grid', 'Wafer Information');
	}

	private makeGridColumns(record: Record.RecordBase): any {
		const showDesc = this.configuration.showDescription;
		if (!showDesc) {
			return [
				{
					name: 'Item',
					width: '15%'
				},
				{
					name: 'Value',
					width: '35%'
				},
				{
					name: 'Item',
					width: '15%'
				},
				{
					name: 'Value',
					width: '35%'
				},
			];
		} else {
			return [
				{
					name: 'Item',
					width: '15%'
				},
				{
					name: 'Value',
					width: '35%'
				},
				{
					name: 'Description',
					width: '50%'
				},
			];
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

