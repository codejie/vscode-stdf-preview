import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STDFAnalyser, Record } from 'stdf-analyser';
import { PreviewPanel, ProcessArgs } from ".";

const COMMAND_CONFIG: string = 'cmd_config';
const COMMAND_COMPONENT: string = 'cmd_component';
const COMMAND_DRAWRECT: string = 'cmd_draw_rect';

export default class RecordsViewPanel extends PreviewPanel {

	private processIncrement: number = 0;
    private recordIncrement: number = 0;

	private recordCount: {
		[key: string]: number
	} = {};

    constructor(context: vscode.ExtensionContext, column: vscode.ViewColumn, status: vscode.StatusBarItem) {
        super(context, {
            uri: context.extensionUri,
            name: 'Full Preview',
            column: column || vscode.ViewColumn.One,
            type: 'records.type',
            resourcePath: ['grid'],
			status: status
        });
    }

    getHtml(): string {
		// const gridStyle = this.getResourceUri('grid/components.css');
		// const commonScript = this.getResourceUri('grid/common.js');
		const scriptUri = this.getResourceUri('grid/view-panel.js');
		const gridUri = this.getResourceUri('grid/gridjs.umd.js');
		const styleMainUri = this.getResourceUri('grid/mermaid.min.css');

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<link href="${styleMainUri}" rel="stylesheet"/>
				<script type="text/javascript" src=${gridUri}></script>
				<script type="text/javascript" src="${scriptUri}"></script>				
			</head>
			<body>
				<div id="container" width="100%"/>
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
				if (this.configuration.recordsLimited !== 0) {
					if (this.recordCount[record.name] !== undefined) {
						if (this.recordCount[record.name] === this.configuration.recordsLimited) {
							this.configuration.recordsIncluded = this.configuration.recordsIncluded?.filter(item => item !== record.name);
							analyser.updateIncluded(this.configuration.recordsIncluded!);
							return Promise.resolve();
						}
						++ this.recordCount[record.name];
					} else {
						this.recordCount[record.name] = 1;
					}
				}
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
		const title = `<font size="6pt">${record.name}_${this.recordIncrement}</font>&nbsp;&nbsp;<font size="4pt">(${record.desc})</font>`;
		this.updateComponent(id, title);
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
		const originalValue = this.configuration.useFieldOriginalValue;
		const recordsLimited = this.configuration.recordsLimited;

		const ret = [];

		if (!showDesc) {
			let t = [];
			for (const field of record.fields) {
				if (notMissing && field.value === undefined) {
					continue;
				}

				t.push(field.name);
				t.push(originalValue ? field.value : field.toValueNotes());
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
				ret.push([no ++, field.name, (originalValue ? field.value : field.toValueNotes()), field.desc]);
			}
		}

		return ret;
	}

    protected updateComponentConfig(component: string, config: any): void {
        this.postViewMessage(COMMAND_CONFIG, {
            component,
            data: config
        });
    }

    protected updateComponent(id: string, title: string): void {
        this.postViewMessage(COMMAND_COMPONENT, {
            id,
            title
        });
    }

    protected drawRectangle(id: string, maxX: number, maxY: number, data: any) {
        this.postViewMessage(COMMAND_DRAWRECT, {
            id,
            maxX,
            maxY,
            data
        });
    }	
}

