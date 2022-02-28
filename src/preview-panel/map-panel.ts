import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STDFAnalyser, Record } from 'stdf-analyser';
import { PreviewPanel, ProcessArgs } from ".";


interface WaferInfoStruct {
	waferId?: string,
	partType?: string,
	lotId?: string,
	total?: number,
	pass?: number,
	
	flat: string,
	minX: number,
	maxX: number,
	posX: string,
	minY: number,
	maxY: number,
	posY: string	 
}

interface BinDataStruct {
	number: number,
	name: string,
	count: number,
	flag: string,
	color: string
}

interface BinColorMap {
	[key: number]: string
}

type MapDataStruct = any[];// x,y,bin,bin

const COLOR_PASS = ['#33691E', '#2E7D32', '#388E3C', '#43A047'];
const COLOR_FAIL = ['#B71C1C', '#C62828', '#D32F2F', '#E53935', '#F44336'];

export default class MapViewPanel extends PreviewPanel {

	private processIncrement: number = 0;

	private binData: BinDataStruct[] = [];
	private mapData: MapDataStruct[] = [];
	private waferInfoData: WaferInfoStruct = {
		flat: 'unknown',
		minX: Number.MAX_SAFE_INTEGER,
		maxX: Number.MIN_SAFE_INTEGER,
		posX: '',
		minY: Number.MAX_SAFE_INTEGER,
		maxY: Number.MIN_SAFE_INTEGER,
		posY: ''			
	};
	private binColorMap: BinColorMap = {};

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
				<div id="map-container" width="100%" height="100%">
					<canvas id="canvas"/>
				</div>
				<div id="container" width="100%"/>
			</body>
			</html>
		`;
    }

	async onFile(process: vscode.Progress<ProcessArgs>, filename: string): Promise<void> {

		// this.drawRectangle('canvas', 0, 0, []);
		// return Promise.resolve();

		this.filename = filename;

		this.viewPanel.title = path.basename(this.filename);

		process.report({
			increment: (this.processIncrement += 1),
			message: 'create STDF analyser...'
		});
		const analyser: STDFAnalyser = new STDFAnalyser({
			included: ['MIR', 'WIR', 'WRR','WCR', 'SBR', 'PRR']
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

		// this.makeMapDataComponent();
		this.makeMapData();

		this.makeBinComponent();
		this.makeBinData();

		this.makeWaferInfoComponent();
		this.makeWaferInfoDtat();


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
			case 'WCR':
				this.onWCR(record);
				break;			
			case 'SBR':
				this.onSBR(record);
				break;
			// case 'PIR':
			// 	this.onPIR(record);
			// 	break;
			case 'PRR':
				this.onPRR(record);
				break;										
			default:
				;
		}

		return Promise.resolve();
	}

	private onMIR(record: Record.RecordBase): void {
		this.waferInfoData.lotId = record.fields[8].value;
		this.waferInfoData.partType = record.fields[9].value;
	}
	
	private onWIR(record: Record.RecordBase): void {
		this.waferInfoData.waferId = record.fields[3].value;
	}

	private onWRR(record: Record.RecordBase): void {
		this.waferInfoData.total = record.fields[3].value;
		this.waferInfoData.pass = record.fields[6].value;
	}	

	private onWCR(record: Record.RecordBase): void {
		this.waferInfoData.flat = record.fields[4].toValueNotes();
		this.waferInfoData.posX = record.fields[7].toValueNotes();
		this.waferInfoData.posY = record.fields[8].toValueNotes();	
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

	// private onPIR(record: Record.RecordBase): void {

	// }

	private onPRR(record: Record.RecordBase): void {
		const x = record.fields[6].value;
		const y = record.fields[7].value;

		if (this.waferInfoData.minX > x)
			this.waferInfoData.minX = x;
		if (this.waferInfoData.maxX < x)
			this.waferInfoData.maxX = x;
		if (this.waferInfoData.minY > y)
			this.waferInfoData.minY = y;
		if (this.waferInfoData.maxY < y)
			this.waferInfoData.maxY = y;

		this.mapData.push([
			x,
			y,
			record.fields[4].value,
			record.fields[5].value
		]);
	}

	makeWaferInfoComponent() {
		const title ='<font size="6pt">Wafer Configuration</font>';
		this.updateComponent('wafer_grid', title);
	}
	makeWaferInfoDtat() {
		const data: any[] = [];
		data.push([
			'WaferId', `${this.waferInfoData.waferId}/${this.waferInfoData.lotId}`,
		 	'ProductId', this.waferInfoData.partType,
			'Pass/Total', `${this.waferInfoData.pass}/${this.waferInfoData.total}`
		]);
		data.push([
			'Wafer Flat', this.waferInfoData.flat,
		 	'X (Min/Max/Pos)', `${this.waferInfoData.minX}/${this.waferInfoData.maxX}/${this.waferInfoData.posX}`,
			'Y (Min/Max/Pos)', `${this.waferInfoData.minY}/${this.waferInfoData.maxY}/${this.waferInfoData.posY}`
		]);

		this.updateComponentConfig('wafer_grid', {
			columns: [
				{
					name: 'Item',
					width: '20%',
					hide: true,
				},
				{
					name: 'Value',
					width: '20%',
					hide: true,
				},
				{
					name: 'Item',
					width: '15%',
					hide: true,
				},
				{
					name: 'Value',
					width: '15%',
					hide: true,
				},
				{
					name: 'Item',
					width: '15%',
					hide: true,
				},
				{
					name: 'Value',
					width: '15%',
					hide: true,
				},				
			],
			data: data
		});	
	}

	private makeBinComponent(): void {
		const title ='<font size="6pt">SoftBin Information</font>';
		this.updateComponent('bin_grid', title);
	}

	private makeBinData(): void {
		const data: any[] = [];
		for (let i = 0; i < this.binData.length; i += 2) {
			data.push([
				this.binData[i].color, this.binData[i].number, this.binData[i].name, this.binData[i].count,
				this.binData[i+1].color, this.binData[i+1].number, this.binData[i+1].name, this.binData[i+1].count
			]);
		}

		this.updateComponentConfig('bin_grid', {
			columns: [
				{
					name: 'Legend',
					width: '10%',
				},
				{
					name: 'Number',
					width: '15%'
				},
				{
					name: 'Name',
					width: '15%',
				},
				{
					name: `Count`,
					width: '10%'
				},
				{
					name: 'Legend',
					width: '10%',
				},
				{
					name: 'Number',
					width: '15%'
				},
				{
					name: 'Name',
					width: '15%',
				},
				{
					name: `Count`,
					width: '10%'
				}	
			],
			data: data
		});
	}

	makeMapDataComponent() {
		const title ='<font size="6pt">SoftBin Map</font>';
		this.updateComponent('bin_map', title);
	}

	makeMapData() {

		this.binData.forEach(item => {
			this.binColorMap[item.number] = item.color;
		});

		this.drawRectangle('canvas', this.waferInfoData.maxX, this.waferInfoData.maxY, {
			bin: this.binColorMap,
			map: this.mapData
		});
	}	
}


