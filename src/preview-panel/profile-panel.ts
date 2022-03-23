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

interface TestNumberStruct {
	// type: string,
	number: number,
	name: string,
	count: number,
	fail: number,
	min: number,
	max: number,
	sum: number
}

interface BinDataStruct {
	type: number,
	number: number,
	name: string,
	count: number,
	flag: string
}

const COMMAND_CONFIG: string = 'cmd_config';
const COMMAND_COMPONENT: string = 'cmd_component';
const COMMAND_DRAWRECT: string = 'cmd_draw_rect';

export default class ProfileViewPanel extends PreviewPanel {

	private processIncrement: number = 0;

	private waferInfo: WaferInfoStruct = {};
	private testNumberData: TestNumberStruct[] = [];
	private binData: BinDataStruct[] = [];

    constructor(context: vscode.ExtensionContext, column: vscode.ViewColumn, status: vscode.StatusBarItem) {
        super(context, {
            uri: context.extensionUri,
            name: 'ProfileView',
            column: column || vscode.ViewColumn.One,
            type: 'profile.type',
            resourcePath: ['grid'],
			status: status
        });
		const file = vscode.workspace.workspaceFile;
		console.log(file);
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
			increment: (this.processIncrement += 10),
			message: 'create STDF analyser...'
		});
		const analyser: STDFAnalyser = new STDFAnalyser({
			included: ['MIR', 'WIR', 'WRR', 'TSR', 'SBR', 'HBR']
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

		this.makeTestNumberComponent();
		this.makeTestNumberData();

		this.makeBinComponent();
		this.makeBinData();

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
			case 'SBR':
				this.onSBR(record);
				break;
			case 'HBR':
				this.onHBR(record);
				break;									
			default:
				;
		}

		return Promise.resolve();
	}

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

		this.makeWaferInfoComponent();
		this.makeWaferInfoData();
	}
		
	private onTSR(record: Record.RecordBase): void {
		if (record.fields[2].value === 'P') {
			this.testNumberData.push({
				number: record.fields[3].value,
				name: record.fields[7].value,
				count: record.fields[4].value,
				fail: record.fields[5].value,
				min: record.fields[12].value,
				max: record.fields[13].value,
				sum: record.fields[14].value
			});
		}
	}

	private onSBR(record: Record.RecordBase): void {
		this.binData.push({
			type: 0,
			number: record.fields[2].value,
			name: record.fields[5].value,
			count: record.fields[3].value,
			flag: record.fields[4].value
		});	
	}

	private onHBR(record: Record.RecordBase): void {
		this.binData.push({
			type: 1,
			number: record.fields[2].value,
			name: record.fields[5].value,
			count: record.fields[3].value,
			flag: record.fields[4].value
		});		
	}

	private makeWaferInfoComponent() {
		const title = `<font size="6pt">Wafer Information</font>`;
		this.updateComponent('wafer_grid', title);
	}

	private makeWaferInfoData() {
		const data: any[] = [];
		data.push(['WaferId', this.waferInfo.waferId, 'ProductId', this.waferInfo.partType]);
		data.push(['LotId', this.waferInfo.lotId, 'SubLotId', this.waferInfo.subLotId]);
		data.push(['PassRate', `${((this.waferInfo.pass! / this.waferInfo.total!) * 100).toFixed(2)}% (${this.waferInfo.pass}/${this.waferInfo.total})`, 'JobName', this.waferInfo.jobName]);
		data.push(['Start', this.waferInfo.start, 'Finish', this.waferInfo.finish]);

		this.updateComponentConfig('wafer_grid', {
			columns: [
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
			],
			data: data
		});	
	}
		
	private makeTestNumberComponent() {
		const title ='<font size="6pt">TestNumber (Parametric) Results</font>';
		this.updateComponent('testnumber_grid', title);
	}

	private makeTestNumberData() {
		const data: any[] = [];
		this.testNumberData.forEach(item => {
			data.push([item.number, item.name, item.count, `${((item.fail/item.count) * 100).toFixed(2)}%`,  (item.sum/(item.count - item.fail)).toFixed(4), item.min.toFixed(4), item.max.toFixed(4)]);
		});

		this.updateComponentConfig('testnumber_grid', {
			columns: [
				{
					name: 'Number',
					width: '15%',
				},
				{
					name: 'Name',
					width: '25%',
					sort: false
				},
				{
					name: 'Count',
					width: '12%',
					sort: false
				},
				{
					name: 'FailRate',
					width: '12%'
				},
				{
					name: 'Average',
					width: '12%',
					sort: false
				},
				{
					name: 'Minium',
					width: '12%',
					sort: false
				},
				{
					name: 'Maxium',
					width: '12%',
					sort: false
				}
			],
			sort: true,
			data: data
		});		
	}

	private makeBinComponent() {
		const title ='<font size="6pt">Bin Results</font>';
		this.updateComponent('bin_grid', title);
	}

	private makeBinData() {
		const data: any[] = [];
		this.binData.forEach(item => {
			data.push([(item.type === 0 ? 'Soft' : 'Hard'), item.number, item.name, item.count, (item.flag === 'F' ? 'Fail' : (item.flag === 'P' ? 'Pass' : 'Unknown'))]);
		});
		this.updateComponentConfig('bin_grid', {
			columns: [
				{
					name: 'Type',
					width: '10%',
					sort: false
				},
				{
					name: 'Number',
					width: '15%'
				},
				{
					name: 'Name',
					width: '35%',
					sort: false
				},
				{
					name: `Count (Total:${this.waferInfo.total})`,
					width: '25%'
				},
				{
					name: 'Flag',
					width: '15%',
					sort: false
				}
			],
			data: data,
			sort: true
		});
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


