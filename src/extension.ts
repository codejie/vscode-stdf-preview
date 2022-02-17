// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DataPriview } from './data-preview';
import { TestView } from './test-panel';
import { Template } from './view-template';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-stdf-preview" is now active!');

	const viewTemplate: Template = new Template();

	const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 300);
	status.text = 'STDF';
	status.show();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-stdf-preview.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from STDF Preview!');
		console.log(context);
	});

	let cmd = vscode.commands.registerCommand('stdf.preview', (args) => {
		console.log(args);
		return new TestView(undefined, context.extensionUri, vscode.ViewColumn.One).viewPanel;
		// const view: DataPriview = new DataPriview();
		// const panel: vscode.WebviewPanel =  view.initWebview('stdf.preview', vscode.ViewColumn.One, undefined, viewTemplate);
		// return panel.webview;
	});
	context.subscriptions.push(cmd);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}