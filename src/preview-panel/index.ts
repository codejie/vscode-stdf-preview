import EventEmitter = require('events');
import * as vscode from 'vscode';

const COMMAND_DATA: string = 'cmd_data';
const COMMAND_CONFIG: string = 'cmd_config';
const COMMAND_RECORD: string = 'cmd_record';

export interface Configuration {
    notShowMissingField: boolean,
    showDescription: boolean 
}

export interface PreviewPanelOptions {
    uri: vscode.Uri,
    type: string,
    resourcePath: string[],

    name: string,
    column: vscode.ViewColumn,

    status: vscode.StatusBarItem
}

export interface ProcessArgs {
    message?: string | undefined;
    increment?: number | undefined;
}

export abstract class PreviewPanel extends EventEmitter {

    protected configuration: Configuration
    protected panel: vscode.WebviewPanel;
    protected filename!: string;

    protected running: boolean = true;

    constructor(protected opts: PreviewPanelOptions) {
        super();

        this.configuration = this.fetchConfiguration(vscode.workspace.getConfiguration('STDF.Preview'));

        this.on('args', (args) => {
            this.onArgs(args);
        });

        this.panel = vscode.window.createWebviewPanel(
            opts.type,
            opts.name,
            opts.column,
            this.getOptions()
        );

        this.panel.onDidDispose(() => {
            this.hideStatus();
            this.panel.dispose();
            // vscode.window.showErrorMessage('CLOSED');
        });

        this.panel.onDidChangeViewState((event) => {
            const actived = event.webviewPanel.visible;
            if (actived) {
                this.onActived();
                this.showStatus();
            } else {
                this.hideStatus();
            }
        });

        this.panel.webview.html = this.getHtml();
    }

    private fetchConfiguration(config: vscode.WorkspaceConfiguration): Configuration {
        const ret: Configuration = {
            notShowMissingField: config.get('notShowMissingField') || false,
            showDescription: config.get('showFieldDescription') || false
        };
    
        return ret;
    }

    private getOptions(): vscode.WebviewPanelOptions & vscode.WebviewOptions {
        const res: vscode.Uri[] = [];
        this.opts.resourcePath.forEach(element => {
            res.push(vscode.Uri.joinPath(this.opts.uri, element));
        });

        return {
            enableScripts: true,
            // enableCommandUris: true,
            // enableForms: true,
            // enableFindWidget: true,
            retainContextWhenHidden: true,
            localResourceRoots: res
        };
    }

    private hideStatus(): void {
        if (this.opts.status) {
            this.opts.status.text = '';
            this.opts.status.hide();
        }
    }

    private showStatus(): void {
        if (this.opts.status) {
            this.opts.status.text = 'STDF';
            this.opts.status.show();
        }
    }

    public get viewPanel(): vscode.WebviewPanel {
        return this.panel;
    }

    protected getResourceUri(file: string): vscode.Uri {
        return this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.opts.uri, file));
    }

    onArgs(args: any): void {
        // this.onFile(args.path);
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'STDF file analysing..',
            cancellable: true
        }, (process, token) => {
            token.onCancellationRequested((event) => {
                // this.emit('stop_request');
                this.running = false;
            });
            return this.onFile(process, args.path);
        });
    }

    protected postViewMessage(command: string, data?: any): void {
        this.panel.webview?.postMessage({
            command: command,
            ...data
        });
    }

    protected updateComponentStyle(component: string, style: any): void {

    }

    protected updateComponentData(component: string, data: any): void {
        this.postViewMessage(COMMAND_DATA, {
            component,
            data
        });
    }

    protected updateComponentConfig(component: string, config: any): void {
        this.postViewMessage(COMMAND_CONFIG, {
            component,
            data: config
        });
    }
    protected updateComponentRecord(name: string, desc: string): void {
        this.postViewMessage(COMMAND_RECORD, {
            name,
            desc
        });
    }

    protected onActived():void {}

    abstract getHtml(): string;
    abstract onFile(process: vscode.Progress<ProcessArgs>, path: string): Promise<void>;
}