import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STDFAnalyser, Record } from 'stdf-analyser';
import { PreviewPanel, ProcessArgs } from ".";

interface BinDataStruct {
	number: number,
	name: string,
	count: number,
	flag: string,
	color: string
}

type MapDataStruct = any[];

const COLOR_PASS = ['#33691E', '#2E7D32', '#388E3C', '#43A047'];
const COLOR_FAIL = ['#B71C1C', '#C62828', '#D32F2F', '#E53935', '#F44336'];

export default class MapViewPanel extends PreviewPanel {

	private processIncrement: number = 0;
    private recordIncrement: number = 0;

	private binData: BinDataStruct[] = [];
	private mapData: MapDataStruct[] = [];

	private passColorInc: number = 0;
	private failColorInc: number = 0;

    constructor(uri: vscode.Uri, column: vscode.ViewColumn, status: vscode.StatusBarItem) {
        super({
            uri: uri,
            name: 'Map Preview',
            column: column || vscode.ViewColumn.One,
            type: 'map.type',
            resourcePath: ['grid'],
			status: status
        });
    }

    getHtml(): string {
		const gridStyle = this.getResourceUri('grid/components.css');
		// const commonScript = this.getResourceUri('grid/common.js');
		const scriptUri = this.getResourceUri('grid/view-panel.js');
		const gridUri = this.getResourceUri('grid/gridjs.umd.js');
		const styleMainUri = this.getResourceUri('grid/mermaid.min.css');

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<link href="${gridStyle}" rel="stylesheet"/>
				<link href="${styleMainUri}" rel="stylesheet"/>
				<script type="text/javascript" src=${gridUri}></script>
				<script type="text/javascript" src="${scriptUri}"></script>				
			</head>
			<body>
				<div id="container" width="100%"/>
				<canvas id="canvas"/>
			</body>
			</html>
		`;
    }

	async onFile(process: vscode.Progress<ProcessArgs>, filename: string): Promise<void> {

		this.drawRectangle('canvas', 0, 0, []);
		return Promise.resolve();

		this.filename = filename;

		this.viewPanel.title = path.basename(this.filename);

		process.report({
			increment: (this.processIncrement += 1),
			message: 'create STDF analyser...'
		});
		const analyser: STDFAnalyser = new STDFAnalyser({
			included: ['SBR', 'PIR', 'PRR']
			// excluded: ['PTR', 'FTR', 'PIR', 'PRR', 'PMR', 'SBR', 'HBR', 'PGR', 'TSR']
		});

		process.report({
			increment: (this.processIncrement += 1),
			message: `open STDF file...`
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
			case 'SBR':
				this.onSBR(record);
				break;
			case 'PIR':
				this.onPIR(record);
				break;
			case 'PRR':
				this.onPRR(record);
				break;										
			default:
				;
		}

		return Promise.resolve();
	}

	private onSBR(record: Record.RecordBase): void {
		this.binData.push({
			number: record.fields[2].value,
			name: record.fields[5].value,
			count: record.fields[3].value,
			flag: record.fields[4].value,
			color: (record.fields[4].value === 'P' ? COLOR_PASS[this.passColorInc ++] : COLOR_FAIL[this.failColorInc ++])
		});	
	}

	private onPIR(record: Record.RecordBase): void {
	}

	private onPRR(record: Record.RecordBase): void {
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
					name: 'No.',
					width: '3%'
				},
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
					width: '47%'
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
			let no = 0;
			for (const field of record.fields) {
				if (notMissing && field.value === undefined) {
					continue;
				}
				ret.push([no ++, field.name, field.toValueNotes(), field.desc]);
			}
		}

		return ret;
	}
}

