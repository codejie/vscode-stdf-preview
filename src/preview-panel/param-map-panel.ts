import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PreviewPanel, ProcessArgs } from '.';
import { STDFAnalyser, Record } from 'stdf-analyser';
import { makeResult } from './helper';

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
	number: number;
	text: string;
	unit: string;
	low: number;
	high: number;
	min: number;
	max: number;
	pass: number;
	sum: number;
	data: number[][]; // x, y, hbin, sbin, result
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

// https://a.atmos.washington.edu/~ovens/javascript/colorpicker.html
const GAP_COLORS: string[] = [
	// '#ffffff',
	'#e6ffe6',
	// '#ccffcc',
	'#b3ffb3',
	// '#99ff99',
	'#80ff80',
	// '#66ff66',
	'#4dff4d',
	// '#33ff33',
	'#1aff1a',
//	'#00ff00',
	'#00e600',
	// '#00cc00',
	'#00b300',
	// '#009900',
	'#008000',
	// '#006600',
	'#004d00',
	// '#003300',
	'#001a00',
	'#001a00' // for max
	// '#000000'
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

    constructor(context: vscode.ExtensionContext, column: vscode.ViewColumn, status: vscode.StatusBarItem) {
        super(context, {
            uri: context.extensionUri,
            name: 'Parametric Map Preview',
            column: column || vscode.ViewColumn.One,
            type: 'param.map.type',
            resourcePath: ['grid'],
			status: status
        });

		this.panel.webview.onDidReceiveMessage(msg => {
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

		const scriptStyle = this.getResourceUri('grid/param-map-panel.css');
		const script = this.getResourceUri('grid/param-map-panel.js');

		const html = this.readResourceFile('grid/param-map-panel.html', {
			'${gridStyle}': gridStyle,
			'${gridScript}': gridScript,
			'${chartScript}': chartScript,
			'${scriptStyle}': scriptStyle,
			'${script}': script,
		});

		return html;
    }

    async onFile(process: vscode.Progress<ProcessArgs>, filename: string): Promise<void> {
		this.filename = filename;

		this.viewPanel.title = path.basename(this.filename);

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

		// this.postUpdateTestItems(this.numberData);
		this.onTestNumberChanged(Object.keys(this.numberData)[0]);

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

					if (ptr.result !== Number.NaN) {
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
						sum: (ptr.result !== Number.NaN ? ptr.result : 0),
						data: [[prr.x, prr.y, prr.hbin, prr.sbin, ptr.result]]
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
        const result = makeResult(record.fields[5].value, (valid === 1), ((optFlag & 0x0001) === 0x0000), record.fields[9].value);

		const lowValid = (optFlag & 0x0050) === 0x0000;
		const highValid = (optFlag & 0x00A0) === 0x0000;

		const lowLimit = makeResult(record.fields[12].value, lowValid, lowValid, record.fields[10].value);
		const highLimit = makeResult(record.fields[13].value, highValid, highValid, record.fields[11].value);

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
			'PassRate', `${((this.waferInfo.pass! / this.waferInfo.total!) * 100).toFixed(2)}% (${this.waferInfo.pass}/${this.waferInfo.total})`,
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

		const opts: TestNumberOptions = this.makeTestNumberOptions(item, data);

		this.postTestNumberItemInfo(item);
		this.postTestNumberDataInfo(data);

		
		this.postTestNumberDataMap(data, opts);
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

	private makeGapColors(opts: TestNumberOptions): void {
		opts.gapColors = {
			'+1': {
				name: 'Invalid',
				color: '#ffff00'
			},
			'+2': {
				name: 'less than low',
				color: '#ff6666'
			},
			'+3': {
				name: 'greater than high',
				color: '#990000'
			}
		};
		
		opts.gap = (opts.max - opts.min) / opts.gapTotal;

		let start = opts.min;
		for (let i = 0; i <= opts.gapTotal; ++ i) {
			opts.gapColors[String.fromCharCode(0x41 + i)] = {
				name: `${start} - ${(start += opts.gap)}`,
				color: GAP_COLORS[i]
			}
		}

		// opts.gapColors[100] = {
		// 	name: 'Invalid',
		// 	color: '#ffff00'
		// };
		// opts.gapColors[101] = {
		// 	name: 'less than low',
		// 	color: '#ff6666'
		// };
		// opts.gapColors[102] = {
		// 	name: 'greater than high',
		// 	color: '#990000'
		// };
	}


	private postTestNumberItemInfo(item: TestNumberItem) {
		// const item = this.numberItems[number];
		const data = [[`${item.number} (${item.seqName})`, 
						`Pass: ${(((item.count - item.fail) / item.count) * 100).toFixed(2)}%(${item.count - item.fail}/${item.count})`,
						`min: ${item.min.toFixed(3)}`,
						`max: ${item.max.toFixed(3)}`],
						`avg: ${(item.sum / (item.count - item.fail)).toFixed(2)}`];
			
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
		// const item = this.numberData[index];
		const data = [
			['Number', `${item.number}`],
			['Text', item.text],
			['Unit', item.unit],
			['Low', `${item.low}`],
			['High', `${item.high}`],
			['Min', `${item.min}`],
			['Max', `${item.max}`],
			['Avg', `${item.sum / item.pass}`]
		];

		this.postViewMessage('update_grid', {
			container: 'numbertable-container',
			grid: {
				opts: {
					rows: 8,
					columns: 2,
					widths: ['auto', 'auto']
				},
				data: data
			}
		});
	}

	private postTestNumberDataMap(item: TestNumberData, opts: TestNumberOptions) {

		const elements: any[] = [];
		item.data.forEach(i => {
			elements.push([i[0], i[1], this.makeResultColorIndex(i[4], opts)]);
		});

		this.postViewMessage('update_map', {
			container: 'number-canvas',
			map: {
				opts: {
					grid: this.configuration.drawBackgroundGrid,
					maxX: this.dieInfo.maxX,
					maxY: this.dieInfo.maxY
				},
				data: {
					elements: elements,
					colors: opts.gapColors
					// colors: [
					// 	{
					// 		index: 1,
					// 		color: '#fff'
					// 	}
					// ]
				}
			}
		});
	}

	private makeResultColorIndex(result: number, opts: TestNumberOptions): string {
		if (Number.isNaN(result)) {
			return '+1';
		} else if (result < opts.low) {
			return '+2';
		} else if (result > opts.high) {
			return '+3';
		} else {
			return String.fromCharCode(0x41 + Math.floor((opts.max - result) / opts.gap));
		}
	}
	
}