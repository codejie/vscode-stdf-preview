import * as vscode from 'vscode';

export interface PreviewPanelOptions {
    uri: vscode.Uri,
    type: string,
    resourcePath: string[],

    name: string,
    column: vscode.ViewColumn
}

export abstract class PreviewPanel {
    private panel: vscode.WebviewPanel;

    constructor(private opts: PreviewPanelOptions) {
        this.panel = vscode.window.createWebviewPanel(
            opts.type,
            opts.name,
            opts.column,
            this.getOptions()
        );

        this.panel.onDidDispose(() => {
            vscode.window.showErrorMessage('CLOSED');
        });
        this.panel.webview.html = this.getHtml();
    }

    private getOptions(): vscode.WebviewPanelOptions & vscode.WebviewOptions {
        const res: vscode.Uri[] = [];
        this.opts.resourcePath.forEach(element => {
            res.push(vscode.Uri.joinPath(this.opts.uri, element));
        });

        return {
            enableScripts: true,
            enableCommandUris: true,
            enableForms: true,
            enableFindWidget: true,
            localResourceRoots: res
        };
    }

    public get viewPanel(): vscode.WebviewPanel {
        return this.panel;
    }

    protected getResourceUri(file: string): vscode.Uri {
        return this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.opts.uri, file));
    }

    abstract getHtml(): string;
}