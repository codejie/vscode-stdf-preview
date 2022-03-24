import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PreviewPanel, ProcessArgs } from '.';
import { STDFAnalyser, Record } from 'stdf-analyser';
import * as helper from './helper';

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

type TestNumberItem = {
	number: number;
	testName: string;
	seqName: string;
	count: number;
	fail: number;
	min: number;
	max: number;
	sum: number;
};

interface TestNumberItemStruct {
    [key: number]: TestNumberItem
}

type TestNumberData = {
	number: number,
	text: string,
	unit: string,
	low: number,
	high: number,
	min: number,
	max: number,
	pass: number,
	sum: number,
	data: number[][], // x, y, hbin, sbin, result
	dev: number,
	sigmas: number[][] // sigma, cp, cpk	
};

interface TestNumberDataStruct {
    [key: string]: TestNumberData
}

interface PTRDataStruct {
	head: number,
	site: number,
	number: number,
	text: string,
	unit: string,
	low: number,
	high: number,
	result: number
}

interface PRRDataStruct {
	head: number,
	site: number,
	x: number,
	y: number,
	hbin: number,
	sbin: number
}

type DieInfoStruct = {
	minX: number,
	maxX: number,
	minY: number,
	maxY: number
};

type TestNumberOptions = {
	number: number,
	text: string,
	min: number,
	max: number,
	avg: number,
	low: number,
	high: number,
	gap: number,
	gapTotal: number,
	gapColors: {
		[key: string]: { // -1: NaN, -2: less low; -3: greater high; normal start from 0
			// order: number,
			name: string,
			color: string
		}
	}
};

type TestNumberMapInfo = {
	cellInfo: any[][], // [x, y, index]
	gapCount: {
		[key: string]: number // index, count
	}
}

// type TestNumberAnalyseDataStruct = {
// 	number: number,
// 	text: string,
// 	pass: number,
// 	total: number,
// 	low: number,
// 	high: number,
// 	min: number,
// 	max: number,
// 	avg: number,
// 	dev: number,
// 	sigmas: number[][] // sigma, cp, cpk
// };

// https://a.atmos.washington.edu/~ovens/javascript/colorpicker.html
// const GAP_COLORS: string[] = [
// 	'#4d0000',// invalid
// 	'#ff00ff', // min
// 	'#ff3300', // max	

// 	'#e6ffe6',
// 	'#b3ffb3',
// 	'#80ff80',
// 	'#4dff4d',
// 	'#1aff1a',
// 	'#00e600',
// 	'#00b300',
// 	'#008000',
// 	'#004d00',
// 	'#001a00',
// ];

const GAP_COLORS: string[] = [
	'#4d0000',// invalid
	'#ff00ff', // min
	'#ff3300', // max

	'#3333ff', // 0
	'#3366ff', // 1
	'#4d94ff', // 2	
	'#66ccff', // 3
	'#00b300', // 4
	'#009900', // 5
	'#ffb366', // 6
	'#ff9900', // 7	
	'#ff8000', // 8
	'#b36b00', // 9
];

const GAP_TOTAL: number = 10;

export default class ParamMapViewPanel extends PreviewPanel {
    private processIncrement: number = 0;

    private waferInfo: WaferInfoStruct = {};
    private numberItems: TestNumberItemStruct = {};
    private numberData: TestNumberDataStruct = {};

	private ptrData: PTRDataStruct[] = [];
	private prrData: PRRDataStruct[] = [];

	private dieInfo: DieInfoStruct = {
		minX: Number.MAX_SAFE_INTEGER,
		maxX: Number.MIN_SAFE_INTEGER,
		minY: Number.MAX_SAFE_INTEGER,
		maxY: Number.MIN_SAFE_INTEGER
	};

    constructor(context: vscode.ExtensionContext, panel?: vscode.WebviewPanel) {
        super(context, panel, {
            uri: context.extensionUri,
            name: 'Parametric Map Preview',
            type: 'stdf.param.map.type',
            resourcePath: ['grid']
        });

		this.panel!.webview.onDidReceiveMessage(msg => {
			switch(msg.command) {
				case 'number_changed': {
					this.onTestNumberChanged(msg.data.value);
				}
			}
		});
    }

    getHtml(): string {
		const gridScript = this.getResourceUri('grid/gridjs.umd.js');
		const gridStyle = this.getResourceUri('grid/mermaid.min.css');
		const chartScript = this.getResourceUri('grid/chart.min.js');
		const chartAnnotationScript = this.getResourceUri('/grid/chartjs-plugin-annotation.min.js');

		const scriptStyle = this.getResourceUri('grid/param-map-panel.css');
		const script = this.getResourceUri('grid/param-map-panel.js');

		const html = this.readResourceFile('grid/param-map-panel.html', {
			'${gridStyle}': gridStyle,
			'${gridScript}': gridScript,
			'${chartScript}': chartScript,
			'${chartAnnotationScript}': chartAnnotationScript,
			'${scriptStyle}': scriptStyle,
			'${script}': script,
		});

		return html;
    }

    async onFile(process: vscode.Progress<ProcessArgs>, filename: string): Promise<void> {
		this.filename = filename;

		this.panel!.title = path.basename(this.filename);

		process.report({
			increment: (this.processIncrement += 1),
			message: 'create STDF analyser...'
		});
		const analyser: STDFAnalyser = new STDFAnalyser({
			included: ['MIR', 'WIR', 'WRR', 'TSR', 'PIR','PTR', 'PRR']
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

		this.analyseTestItemData();
		this.onTestNumberChanged(Object.keys(this.numberData)[0]);

		process.report({
			increment: 100,
			message: 'process end.'
		});

		this.postTestNumberAnalyseData();

		return Promise.resolve();
    }

	private analyseTestItemData(): void {
		Object.keys(this.numberData).forEach(key => {
			const item = this.numberData[key];

			const avg = item.sum / item.pass;
			const data: number[] = [];
			item.data.forEach(i => {
				if (!Number.isNaN(i[4])) {
					data.push(i[4]);
				}
			});
			item.dev = helper.deviation(avg, data);
			const low = (Number.isNaN(item.low) || item.low === undefined) ? item.min : item.low;
			const high = (Number.isNaN(item.high) || item.low === undefined) ? item.max : item.high;

			// const sigmas: number[][] = [];
			for (let s = 6; s > 0; -- s) {
				const cp = helper.cp(s, low, high, item.dev);
				const cpk = helper.cpk(cp, avg, low, high);

				item.sigmas.push([s, cp, cpk]);
			}
		});		
	}

	// onTestNumberAnalyse(): void {
	// 	const ret: TestNumberAnalyseDataStruct[] = [];
	// 	Object.keys(this.numberData).forEach(key => {
	// 		const item = this.numberData[key];

	// 		const avg = item.sum / item.pass;
	// 		const data: number[] = [];
	// 		item.data.forEach(i => {
	// 			if (!Number.isNaN(i[4])) {
	// 				data.push(i[4]);
	// 			}
	// 		});
	// 		const dev = helper.deviation(avg, data);
	// 		const low = (Number.isNaN(item.low) || item.low === undefined) ? item.min : item.low;
	// 		const high = (Number.isNaN(item.high) || item.low === undefined) ? item.max : item.high;

	// 		const sigmas: number[][] = [];
	// 		for (let s = 6; s > 0; -- s) {
	// 			const cp = helper.cp(s, low, high, dev);
	// 			const cpk = helper.cpk(cp, avg, low, high);

	// 			sigmas.push([s, cp, cpk]);
	// 		}

	// 		ret.push({
	// 			number: item.number,
	// 			text: item.text,
	// 			pass: item.pass,
	// 			total: item.data.length,
	// 			low,
	// 			high,
	// 			min: item.min,
	// 			max: item.max,
	// 			avg,
	// 			dev,
	// 			sigmas
	// 		});
	// 	});

	// 	const gridData: string[][] = [];
	// 	let no = 0;
	// 	ret.forEach(item => {
	// 		const t = [];
	// 		t.push(...[
	// 			`${++ no}`,
	// 			`${item.number}-${item.text}`,
	// 			`${(item.pass / (item.total) * 100).toFixed(2)}%`,
	// 			`${item.low.toFixed(3)}/${item.high.toFixed(3)}`,
	// 			`${item.min.toFixed(3)}/${item.max.toFixed(3)}`
	// 		]);
	// 		item.sigmas.forEach(s => {
	// 			s.forEach(i => {
	// 				t.push(i.toFixed(3));
	// 			})
	// 		});
	// 		gridData.push(t);
	// 	});

	// 	const data = {
	// 		container: 'number-analyse-grid',
	// 		grid: {
	// 			columns: [
	// 				{
	// 					name: 'No',
	// 					width: '3%'
	// 				},
	// 				{
	// 					name: 'Index',
	// 					width: '12%'
	// 				},
	// 				{
	// 					name: 'PassRate',
	// 					width: '8%'
	// 				},
	// 				{
	// 					name: 'Limited',
	// 					width: '10%'
	// 				},
	// 				{
	// 					name: 'Range',
	// 					width: '10%'
	// 				},
	// 				{
	// 					name: '6Sigma',
	// 					columns: [
	// 						{
	// 							name: 'cp'
	// 						},
	// 						{
	// 							name: 'cpk'
	// 						}
	// 					]
	// 				},
	// 				{
	// 					name: '5Sigma',
	// 					columns: [
	// 						{
	// 							name: 'cp'
	// 						},
	// 						{
	// 							name: 'cpk'
	// 						}
	// 					]
	// 				},
	// 				{
	// 					name: '4Sigma',
	// 					columns: [
	// 						{
	// 							name: 'cp'
	// 						},
	// 						{
	// 							name: 'cpk'
	// 						}
	// 					]
	// 				},
	// 				{
	// 					name: '3Sigma',
	// 					columns: [
	// 						{
	// 							name: 'cp'
	// 						},
	// 						{
	// 							name: 'cpk'
	// 						}
	// 					]
	// 				},
	// 				{
	// 					name: '2Sigma',
	// 					columns: [
	// 						{
	// 							name: 'cp'
	// 						},
	// 						{
	// 							name: 'cpk'
	// 						}
	// 					]
	// 				},
	// 				{
	// 					name: '1Sigma',
	// 					columns: [
	// 						{
	// 							name: 'cp'
	// 						},
	// 						{
	// 							name: 'cpk'
	// 						}
	// 					]
	// 				}								
	// 			],
	// 			data: gridData
	// 		}
	// 	};

	// 	this.postViewMessage('update_number_analyse', data);

	// 	// return ret;
	// }

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
			case 'PIR':
				this.onPIR(record);
				break;
			case 'PTR':
				this.onPTR(record);
				break;
            case 'PRR':
                this.onPRR(record);
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

		this.postWaferInfo();
	}

	private onTSR(record: Record.RecordBase): void {
        if (record.fields[2].value === 'P') {
            this.numberItems[record.fields[3].value] = {
				number: record.fields[3].value,
				testName: record.fields[7].value,
                seqName: record.fields[8].value,
				count: record.fields[4].value,
				fail: record.fields[5].value,
				min: record.fields[12].value,
				max: record.fields[13].value,
				sum: record.fields[14].value                
            }
        }        
    }
    
	private onPIR(record: Record.RecordBase): void {
		this.ptrData.forEach(ptr => {
			const prr = this.prrData.find(item => (item.head === ptr.head && item.site === ptr.site));
			if (prr) {
				const index = this.makeNumberIndex(ptr.number, ptr.text);
				const data = this.numberData[index];
				if (data) {
					if (data.min > ptr.result) {data.min = ptr.result;}
					if (data.max < ptr.result) {data.max = ptr.result;}

					if (!Number.isNaN(ptr.result)) {
						++ data.pass;
						data.sum += ptr.result;
					}
					data.data.push([prr.x, prr.y, prr.hbin, prr.sbin, ptr.result]);
				} else {
					this.numberData[index] = {
						number: ptr.number,
						text: ptr.text,
						unit: ptr.unit,
						low: ptr.low,
						high: ptr.high,
						min: ptr.result,
						max: ptr.result,
						pass: 1,
						sum: (Number.isNaN(ptr.result) ? 0 : ptr.result),
						data: [[prr.x, prr.y, prr.hbin, prr.sbin, ptr.result]],
						dev: 0,
						sigmas: []
					};

					this.postUpdateTestItem(`${ptr.number} - ${ptr.text}`, index);
				}

				if (this.dieInfo.minX > prr.x) {this.dieInfo.minX = prr.x;}
				if (this.dieInfo.maxX < prr.x) {this.dieInfo.maxX = prr.x;}
				if (this.dieInfo.minY > prr.y) {this.dieInfo.minY = prr.y;}
				if (this.dieInfo.maxY < prr.y) {this.dieInfo.maxY = prr.y;}
			} else {
				// console.log(`CANNOT find x/y - ${ptr.head}-${ptr.site}`);
			}
		});

		this.ptrData = [];
		this.prrData = [];
    }

	private makeNumberIndex(number: number, text: string): string {
		return `${number}-${text}`;
	}
    
	private onPTR(record: Record.RecordBase): void {

        const optFlag = record.fields[8].value;
        const valid = (record.fields[3].value === 0) ? 1 : 0;
        const result = helper.makeResult(record.fields[5].value, (valid === 1), ((optFlag & 0x0001) === 0x0000), record.fields[9].value);

		const lowValid = (optFlag & 0x0050) === 0x0000;
		const highValid = (optFlag & 0x00A0) === 0x0000;

		const lowLimit = helper.makeResult(record.fields[12].value, lowValid, lowValid, record.fields[10].value);
		const highLimit = helper.makeResult(record.fields[13].value, highValid, highValid, record.fields[11].value);

		this.ptrData.push({
			head: record.fields[1].value,
			site: record.fields[2].value,
			number: record.fields[0].value,
			text: record.fields[6].value,
			unit: record.fields[14].value,
			low: lowLimit,
			high: highLimit,
			result: result
		});
    } 
    
	private onPRR(record: Record.RecordBase): void {
		this.prrData.push({
			head: record.fields[0].value,
			site: record.fields[1].value,
			hbin: record.fields[4].value,
			sbin: record.fields[5].value,
			x: record.fields[6].value,
			y: record.fields[7].value
		});
    }

	private postWaferInfo() {
		const data: any[] = [];
		data.push(['WaferId', this.waferInfo.waferId, 'LotId', this.waferInfo.lotId, 'JobName', this.waferInfo.jobName]);
		data.push(['ProductId', this.waferInfo.partType, 
			'PassRate', `${((this.waferInfo.pass! / this.waferInfo.total!) * 100).toFixed(3)}% (${this.waferInfo.pass}/${this.waferInfo.total})`,
			'Start', this.waferInfo.start]);
			
		this.postViewMessage('update_grid', {
			container: 'waferinfo-container',
			grid: {
				opts: {
					rows: 2,
					columns: 6,
					widths: ['10%', '20%', '10%', '20%', '10%', '30%']
				},
				data: data
			}
		});
	}
    
	private postUpdateTestItem(item: string, index: string) {
		this.postViewMessage('update_select_option', {
			container: 'number-select',
			option: {
				text: item,
				index: index
			}
		});
	}

	private onTestNumberChanged(index: string) {
		// console.log(data.value);

		const data = this.numberData[index];
		const item = this.numberItems[data.number];

		this.postTestNumberItemInfo(item);
		this.postTestNumberDataInfo(data);

		const opts: TestNumberOptions = this.makeTestNumberOptions(item, data);
		const mapInfo: TestNumberMapInfo = this.makeTestNumberMapInfo(item, data, opts);
		
		this.postTestNumberDataMap(mapInfo, opts);
	}

	private makeTestNumberOptions(item: TestNumberItem, data: TestNumberData): TestNumberOptions{
		const ret: TestNumberOptions = {
			number: data.number,
			text: data.text,
			min: data.min,
			max: data.max,
			avg: data.sum / data.pass,
			low: data.low,
			high: data.high,
			gap: 0,
			gapTotal: GAP_TOTAL,
			gapColors: {}
		};

		this.makeGapColors(ret);

		return ret;
	}

	makeTestNumberMapInfo(item: TestNumberItem, data: TestNumberData, opts: TestNumberOptions): TestNumberMapInfo {
		const ret: TestNumberMapInfo = {
			cellInfo: [],
			gapCount: {}
		};

		data.data.forEach(i => {
			const index = this.makeResultColorIndex(i[4], opts);
			ret.cellInfo.push([i[0], i[1], index]);
			if (ret.gapCount[index]) {
				++ ret.gapCount[index];
			} else {
				ret.gapCount[index] = 1;
			}
		});

		return ret;
	}
	
	private makeResultColorIndex(result: number, opts: TestNumberOptions): string {
		if (Number.isNaN(result)) {
			return '+1';
		} else if (result < opts.low) {
			return '+2';
		} else if (result > opts.high) {
			return '+3';
		} else {
			// let index =  Math.floor((opts.max - result) / opts.gap);
			let index =  Math.floor((result - opts.min) / opts.gap);
			if (index === opts.gapTotal)
				index = opts.gapTotal - 1;
			return String.fromCharCode(0x41 + index);
		}
	}	

	private makeGapColors(opts: TestNumberOptions): void {
		opts.gapColors = {
			'+1': {
				name: 'Invalid',
				color: GAP_COLORS[0]
			},
			'+2': {
				name: 'Less than low',
				color: GAP_COLORS[1]
			},
			'+3': {
				name: 'Greater than high',
				color: GAP_COLORS[2]
			}
		};
		
		opts.gap = (opts.max - opts.min) / opts.gapTotal;

		let start = opts.min;
		for (let i = 0; i < opts.gapTotal; ++ i) {
			opts.gapColors[String.fromCharCode(0x41 + i)] = {
				name: `${start} - ${(start += opts.gap)}`, // ${String.fromCharCode(0x41 + i)} : 
				color: GAP_COLORS[3 + i]
			}
		}
	}


	private postTestNumberItemInfo(item: TestNumberItem) {
		const avg = (item.sum / (item.count - item.fail));
		const data = [[`${item.number} (${item.seqName})`, 
						`Pass: ${(((item.count - item.fail) / item.count) * 100).toFixed(3)}%(${item.count - item.fail}/${item.count})`,
						`min: ${item.min}`,
						`max: ${item.max}`,
						`sum: ${Number.isNaN(avg) ? 'NaN' : avg}`]];
			
		this.postViewMessage('update_grid', {
			container: 'numbergrid-container',
			grid: {
				opts: {
					rows: 1,
					columns: 5,
					widths: ['auto', 'auto', 'auto', 'auto', 'auto']
				},
				data: data
			}
		});
	}

	private postTestNumberDataInfo(item: TestNumberData) {
		const data = [
			['Number', `${item.number}`,
			'Text', item.text,
			'Unit', item.unit],
			['PassRate', `${((item.pass / item.data.length) * 100).toFixed(3)}% (${item.pass}/${item.data.length})`,
			'Low', `${item.low}`,
			'High', `${item.high}`],
			['Avg', `${item.sum / item.pass}`,
			'Min', `${item.min}`,
			'Max', `${item.max}`],
			['Devation', `${item.dev}`,
			'6sigma.cp', `${item.sigmas![0][1]}`,
			'6sigma.cpk', `${item.sigmas![0][2]}`]
		];

		this.postViewMessage('update_grid', {
			container: 'numbertable-container',
			grid: {
				opts: {
					rows: 4,
					columns: 6,
					widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto']
				},
				data: data
			}
		});

	}

	private postTestNumberDataMap(info: TestNumberMapInfo, opts: TestNumberOptions) {
		this.postViewMessage('update_map', {
			container: 'number-canvas',
			map: {
				opts: {
					grid: this.configuration.drawBackgroundGrid,
					maxX: this.dieInfo.maxX,
					maxY: this.dieInfo.maxY
				},
				data: {
					elements: info.cellInfo,
					colors: opts.gapColors
				}
			}
		});

		this.postViewMessage('update_map_chart', {
			container: 'number-chart',
			chart: {
				opts: {
					labels: ['Invalid', 'Less Min', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Greater Max'],
					orders: ['+1', '+2', 'A', 'B','C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', '+3']
				},
				data: {
					data: info.gapCount,
					colors: opts.gapColors,
					lines: [
						{
							name: 'Min',
							color: '#ccff66',
							xPos: 2 + ((opts.min - opts.min) / opts.gap)
						},
						{
							name: 'Max',
							color: '#ccff66',
							xPos: 2 + ((opts.max - opts.min) / opts.gap)
						},
						{
							name: 'Average',
							color: '#66ff33',
							xPos: 2 + ((opts.avg - opts.min) / opts.gap)
						},
						{
							name: 'Low',
							color: '#ff0066',
							xPos: 2 + ((opts.low - opts.min) / opts.gap)
						},
						{
							name: 'High',
							color: '#ff0066',
							xPos: 2 + ((opts.high - opts.min) / opts.gap)
						}
					]
				}
			}
		});
	}

	postTestNumberAnalyseData() {
		const data: string[][] = [];

		data.push(['No', 'Number', 'Text', 'Pass', 'Average', 'Devation',
				'6σ.cp', '6σ.cpk','5σ.cp', '5σ.cpk','4σ.cp', '4σ.cpk',
				'3σ.cp', '3σ.cpk','2σ.cp', '2σ.cpk','1σ.cp', '1σ.cpk']);

		let no = 0;
		Object.keys(this.numberData).forEach(key => {
			const item = this.numberData[key];
			const t = [];
			t.push(...[
				`${++ no}`,
				`${item.number}`,
				`${item.text}`,
				`${(item.pass / (item.data.length) * 100).toFixed(2)}%`,
				`${(item.sum / item.pass).toFixed(2)}`,
				`${item.dev.toFixed(3)}`
			]);
			item.sigmas.forEach(s => {
				t.push(s[1].toFixed(3));
				t.push(s[2].toFixed(3));
			});
			data.push(t);
		});

		this.postViewMessage('update_grid', {
			container: 'number-analyse-grid',
			grid: {
				opts: {
					rows: (no - 1),
					columns: 18,
					widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto',
						'auto', 'auto', 'auto', 'auto', 'auto', 'auto',
						'auto', 'auto', 'auto', 'auto', 'auto', 'auto']
				},
				data: data
			}
		});
	}	
	
}