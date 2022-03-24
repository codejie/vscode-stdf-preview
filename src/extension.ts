// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { STDFEditorProvider } from './editor-provider';
import ParamMapViewPanel from './preview-panels/param-map-panel';
import ProfileViewPanel from './preview-panels/profile-panel';
import RecordsViewPanel from './preview-panels/records-panel';
import SBinMapViewPanel from './preview-panels/sbin-map-panel';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-stdf-preview" is now active!');
	const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 300);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('vscode-stdf-preview.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from STDF Preview!');
	// 	console.log(context);
	// });
	let profile = vscode.commands.registerCommand('stdf.profile.preview', async (args) => {
		const profileViewPanel: ProfileViewPanel = new ProfileViewPanel(context);
		profileViewPanel.emit('args', args);
		return profileViewPanel.viewPanel;
	});
	context.subscriptions.push(profile);

	let map = vscode.commands.registerCommand('stdf.map.sbin.preview', (args) => {
		const mapViewPanel = new SBinMapViewPanel(context);
		mapViewPanel.emit('args', args);
		return mapViewPanel.viewPanel;
	});
	context.subscriptions.push(map);	

	let param = vscode.commands.registerCommand('stdf.map.param.preview', (args) => {
		const panel: ParamMapViewPanel = new ParamMapViewPanel(context);
		panel.emit('args', args);
		return panel.viewPanel;
	});
	context.subscriptions.push(param);	

	let records = vscode.commands.registerCommand('stdf.records.preview', (args) => {
		const recordsViewPanel = new RecordsViewPanel(context);
		recordsViewPanel.emit('args', args);
		return recordsViewPanel.viewPanel;
	});
	context.subscriptions.push(records);

	let provider = vscode.window.registerCustomEditorProvider(STDFEditorProvider.viewType, new STDFEditorProvider(context), {
		webviewOptions: {
			retainContextWhenHidden: true
		},
		supportsMultipleEditorsPerDocument: true
	});
	context.subscriptions.push(provider);
}

// this method is called when your extension is deactivated
export function deactivate() {}