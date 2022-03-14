/* eslint-disable curly */
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
	color?: string
}

// interface BinColorMap {
// 	[key: number]: string
// }

type MapDataStruct = any[];// x,y,bin,bin

// const COLOR_PASS = ['#00FF00', '#33FF33', '#33FF66', '#33FF99'];
// const COLOR_FAIL = ['#FF0000', '#FF0033', '#FF0066', '#FF0099', '#990033', '#990066', '#990000'];

export default class SBinMapViewPanel extends PreviewPanel {

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

	private passColor = 0x00FF00;
	private failColor = 0xFF0000;
	// private binColorMap: BinColorMap[] = [];

	// private passColorInc: number = 0;
	// private failColorInc: number = 0;

    constructor(uri: vscode.Uri, column: vscode.ViewColumn, status: vscode.StatusBarItem) {
        super({
            uri: uri,
            name: 'SBin Map Preview',
            column: column || vscode.ViewColumn.One,
            type: 'sbin.map.type',
            resourcePath: ['grid'],
			status: status
        });
    }

    getHtml(): string {
		const gridStyle = this.getResourceUri('grid/sbin-map-view-panel.css');
		const scriptUri = this.getResourceUri('grid/sbin-map-view-panel.js');
		const gridUri = this.getResourceUri('grid/gridjs.umd.js');
		const styleMainUri = this.getResourceUri('grid/mermaid.min.css');

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<link href="${gridStyle}" rel="stylesheet"/>
				<link href="${styleMainUri}" rel="stylesheet"/>
				<script type="text/javascript" src=${gridUri}></script>			
			</head>
			<body>
				<div id="container" width="100%"/>
				<div id="map-container" width="100%" height="100%">
					<canvas id="canvas"/>
				</div>
				<script type="text/javascript" src="${scriptUri}"></script>	
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

		this.makeBinColor();

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
			// color: this.makeBinColor(record.fields[2].value, record.fields[4].value === 'P')
		});
	}

	private makeBinColor(): void {

		this.binData.sort((a, b) => {
			if (a.number < b.number)
				return -1;
			else if (a.number > b.number)
				return 1;
			else
				return 0;
		});

		this.binData.forEach(item => {
			if (item.flag === 'P') {
				item.color = `#${('000000' + this.passColor.toString(16)).slice(-6)}`;
				this.passColor += 0x33;
			} else {
				item.color = `#${('000000' + this.failColor.toString(16)).slice(-6)}`;
				if (this.failColor === 0xFF00FF) {
					this.failColor = 0xFF6600;
				} else if (this.failColor === 0xFF66FF) {
					this.failColor = 0xFF9900;
				} else {
					this.failColor += 0x33;
				}
			}
		});
	}

	// private onPIR(record: Record.RecordBase): void {

	// }

	private onPRR(record: Record.RecordBase): void {
		const x = record.fields[6].value;
		const y = record.fields[7].value;

		if (this.waferInfoData.minX > x) {
			this.waferInfoData.minX = x;
		}
		if (this.waferInfoData.maxX < x) {
			this.waferInfoData.maxX = x;
		}
		if (this.waferInfoData.minY > y) {
			this.waferInfoData.minY = y;
		}
		if (this.waferInfoData.maxY < y) {
			this.waferInfoData.maxY = y;
		}

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
					width: '10%'
				},
				{
					name: 'Value',
					width: '25%'
				},
				{
					name: 'Item',
					width: '10%'
				},
				{
					name: 'Value',
					width: '25%'
				},
				{
					name: 'Item',
					width: '10%'
				},
				{
					name: 'Value',
					width: '25%'
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
		for (let i = 0; i < this.binData.length; i += 3) {
			data.push([
				this.binData[i].number, this.binData[i].count, this.binData[i].name,
				this.binData[i+1].number, this.binData[i+1].count, this.binData[i+1].name,
				this.binData[i+2].number, this.binData[i+2].count, this.binData[i+2].name
			]);
		}

		this.updateComponentConfig('bin_grid', {
			columns: [
				{
					name: 'Number',
					width: '5%'
				},
				{
					name: `Count`,
					width: '8%'
				},				
				{
					name: 'Name',
					width: '17%',
				},
				{
					name: 'Number',
					width: '5%'
				},
				{
					name: `Count`,
					width: '8%'
				},				
				{
					name: 'Name',
					width: '17%',
				},
				{
					name: 'Number',
					width: '5%'
				},
				{
					name: `Count`,
					width: '8%'
				},				
				{
					name: 'Name',
					width: '17%',
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
		this.drawRectangle('canvas', this.waferInfoData.maxX, this.waferInfoData.maxY, {
			bin: this.binData, // this.binColorMap,
			map: this.mapData,
			grid: this.configuration.drawBackgroundGrid
		});
	}	
}


