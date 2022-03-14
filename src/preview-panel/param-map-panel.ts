import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PreviewPanel, ProcessArgs } from '.';
import { STDFAnalyser, Record } from 'stdf-analyser';

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

interface TestNumberItemStruct {
    [key: number]: {
        number: number,
        testName: string,
        seqName: string,
        count: number,
        fail: number,
        min: number,
        max: number,
        sum: number
    }
}

interface TestNumberDataStruct {
    [key: string]: {
        number: number,
        text: string,
        unit: string,
        low: number,
        high: number,
        min: number,
        max: number,
        data: number[][] // x, y, hbin, sbin, value
    }
}

export default class ParamMapViewPanel extends PreviewPanel {
    private processIncrement: number = 0;

    private waferInfo: WaferInfoStruct = {};
    private numberItems: TestNumberItemStruct = {};
    private numberData: TestNumberDataStruct = {};

    constructor(uri: vscode.Uri, column: vscode.ViewColumn, status: vscode.StatusBarItem) {
        super({
            uri: uri,
            name: 'Parametric Map Preview',
            column: column || vscode.ViewColumn.One,
            type: 'param.map.type',
            resourcePath: ['grid'],
			status: status
        });
    }

    getHtml(): string {
		const gridStyle = this.getResourceUri('grid/components.css');
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
				<script type="text/javascript" src="${scriptUri}"></script>				
			</head>
			<body>
                <div class="container">
                    <div class="sub-container">
                        <label for="number-select">选择测试项</label>
                    </div>
                    <div class="sub-container">
                        <select name="testNumber" id="number-select">
                            <option value="1">TestNumber - 1</option>
                        </select>
                    </div>
                </div>
				<div class="container">
					<canvas id="canvas" width="200px" height="500px"/>
				</div>
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

		// this.makeWaferInfoComponent();
		// this.makeWaferInfoData();
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
        
    } 
    
	private onPTR(record: Record.RecordBase): void {
    } 
    
	private onPRR(record: Record.RecordBase): void {
    }     
}