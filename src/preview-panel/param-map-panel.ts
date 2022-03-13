import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PreviewPanel, ProcessArgs } from '.';

export default class ParamMapViewPanel extends PreviewPanel {

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
		// const commonScript = this.getResourceUri('grid/common.js');
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
    onFile(process: vscode.Progress<ProcessArgs>, path: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
}