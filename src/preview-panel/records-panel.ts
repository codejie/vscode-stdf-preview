import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STDFAnalyser, Record } from 'stdf-analyser';
import { PreviewPanel, ProcessArgs } from ".";

export default class RecordsViewPanel extends PreviewPanel {

	private processIncrement: number = 0;

    private recordIncrement: number = 0;

    constructor(uri: vscode.Uri, column: vscode.ViewColumn, status: vscode.StatusBarItem) {
        super({
            uri: uri,
            name: 'Full Preview',
            column: column || vscode.ViewColumn.One,
            type: 'full.type',
            resourcePath: ['grid'],
			status: status
        });
    }

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
			increment: (this.processIncrement += 1),
			message: 'create STDF analyser...'
		});
		const analyser: STDFAnalyser = new STDFAnalyser({
			// included: ['MIR', 'WIR', 'PTR']
			included: this.configuration.recordsIncluded //['FAR','ATR','MIR','MRR','PCR','WIR','WRR','WCR','BPS','EPS','GDR','DTR','TSR'],
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
			increment: (this.processIncrement += 1),
			message: ` ${record.name}_${this.processIncrement} record ..`
		});

		this.defaultRecord(record);

        ++ this.recordIncrement;

		return Promise.resolve();
	}

	private defaultRecord(record: Record.RecordBase): void {
        const id = `${record.name}_GRID_${this.recordIncrement}`;
		this.updateComponentRecord(id, `${record.name}_${this.recordIncrement}`, record.desc || '');
		const data = {
			columns: this.makeGridColumns(record),
			data: this.makeGridData(record)
		};
		this.updateComponentConfig(id, data);
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

