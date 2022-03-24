import EventEmitter = require('events');
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface Configuration {
    recordsIncluded: string[] | undefined,
    notShowMissingField: boolean,
    showDescription: boolean,
    drawBackgroundGrid?: boolean,
    useFieldOriginalValue: boolean,
    recordsLimited: number
}

export interface PreviewPanelOptions {
    uri: vscode.Uri,
    type: string,
    resourcePath: string[],

    name: string,

    // column: vscode.ViewColumn,
    // status: vscode.StatusBarItem
}

export interface ProcessArgs {
    message?: string | undefined;
    increment?: number | undefined;
}

export abstract class PreviewPanel extends EventEmitter {
    // protected context: vscode.ExtensionContext;
    // protected opts: PreviewPanelOptions;
    protected configuration: Configuration;
    protected status: vscode.StatusBarItem;

    // protected panel: vscode.WebviewPanel;
    protected filename!: string;

    protected running: boolean = true;

    constructor(protected readonly context: vscode.ExtensionContext,
            protected panel: vscode.WebviewPanel | undefined = undefined,
            protected readonly opts: PreviewPanelOptions) {
        super();

        this.configuration = this.fetchConfiguration(vscode.workspace.getConfiguration('STDF.Preview'));
        this.status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 300);

        if (!this.panel) {
            this.panel = vscode.window.createWebviewPanel(
                opts.type,
                opts.name,
                vscode.ViewColumn.One,
                this.getOptions()
            );
        };

        // this.showStatus();

        this.panel.onDidDispose(() => {
            // this.hideStatus();
            this.panel!.dispose();
        });

        // this.panel.onDidChangeViewState((event) => {
        //     const actived = event.webviewPanel.visible;
        //     if (actived) {
        //         this.onActived();
        //         this.showStatus();
        //     } else {
        //         this.hideStatus();
        //     }
        // });

        this.on('args', (args) => {
            this.onArgs(args);
        });

        this.panel.webview.options = {
            enableScripts: true
        };
        
        this.panel.webview.html = this.getHtml();
    }

    private fetchConfiguration(config: vscode.WorkspaceConfiguration): Configuration {
        let included: string | string[] | undefined = config.get('recordsIncluded');
        if (included === undefined || included.length === 0) {
            included = undefined;
        } else {
            included = (<string>included).toUpperCase().split(',');
        }
        const ret: Configuration = {
            recordsIncluded: included,
            notShowMissingField: config.get('notShowMissingField') || false,
            showDescription: config.get('showFieldDescription') || false,
            drawBackgroundGrid: config.get('drawBackgroundGrid'),
            useFieldOriginalValue: config.get('useFieldOriginalValue') || false,
            recordsLimited: config.get('recordsLimited') || 10
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

    public get viewPanel(): vscode.WebviewPanel {
        return this.panel!;
    }

    public stop(): void {
        this.running = false;
    }

    private hideStatus(): void {
        this.status.text = '';
        this.status.hide();
    }

    private showStatus(): void {
        this.status.text = 'STDF';
        this.status.show();
    }

    protected getResourceUri(file: string): vscode.Uri {
        return this.panel!.webview.asWebviewUri(vscode.Uri.joinPath(this.opts.uri, file));
    }

    protected readResourceFile(file: string, items: { [key: string]: vscode.Uri}): string {
        let ret = fs.readFileSync(path.join(this.context.asAbsolutePath(file))).toString('utf-8');
        Object.keys(items).forEach(key => {
            ret = ret.replace(`${key}`, `${items[key]}`);
        });
        return ret;
    }

    protected onArgs(args: any): void {
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
            return this.onFile(process, args._fsPath);// args.path);
        });
    }

    protected postViewMessage(command: string, data?: any): void {
        this.panel!.webview?.postMessage({
            command: command,
            ...data
        });
    }

    protected onActived():void {}

    abstract getHtml(): string;
    abstract onFile(process: vscode.Progress<ProcessArgs>, path: string): Promise<void>;
}