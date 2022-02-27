// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Configuration } from './preview-panel';
import DetailViewPanel from './preview-panel/detail-panel';
import RecordsViewPanel from './preview-panel/records-panel';
import ProfileViewPanel from './preview-panel/profile-panel';
import MapViewPanel from './preview-panel/map-panel';


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
		const profileViewPanel: ProfileViewPanel = new ProfileViewPanel(context.extensionUri, vscode.ViewColumn.One, status);
		profileViewPanel.emit('args', args);
		return profileViewPanel.viewPanel;
	});
	context.subscriptions.push(profile);

	let map = vscode.commands.registerCommand('stdf.map.preview', (args) => {
		const mapViewPanel = new MapViewPanel(context.extensionUri, vscode.ViewColumn.One, status);
		mapViewPanel.emit('args', args);
		return mapViewPanel.viewPanel;
	});
	context.subscriptions.push(map);	

	let detail = vscode.commands.registerCommand('stdf.detail.preview', (args) => {
		const detailViewPanel = new DetailViewPanel(context.extensionUri, vscode.ViewColumn.One, status);
		return detailViewPanel.viewPanel;
	});
	context.subscriptions.push(detail);	

	let records = vscode.commands.registerCommand('stdf.records.preview', (args) => {
		const recordsViewPanel = new RecordsViewPanel(context.extensionUri, vscode.ViewColumn.One, status);
		recordsViewPanel.emit('args', args);
		return recordsViewPanel.viewPanel;
	});
	context.subscriptions.push(records);		

	// context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}