import * as vscode from 'vscode';

interface ViewOptions {
    options: vscode.WebviewPanelOptions & vscode.WebviewOptions,
    html: string
}

interface ViewScripts {
    [key: string]: ViewOptions
};

export enum ViewType {
    profile = 'protile.type',
    detail = 'detail.type'
};

export const ProfileView: string = 'profile.type';
export const  

export interface PreviewPanelOptions {
    uri: vscode.Uri,
    type: string,
    resourcePath: string[],

    name: string,
    column: vscode.ViewColumn,
    status?: vscode.StatusBarItem
}

export abstract class PreviewPanel {
    public static loadScripts(uri: vscode.Uri): ViewScripts {
        const ret = {
            `${ViewType.profile}`: 
        }

    }

    private panel: vscode.WebviewPanel;

    constructor(private opts: PreviewPanelOptions) {
        this.panel = vscode.window.createWebviewPanel(
            opts.type,
            opts.name,
            opts.column,
            this.getOptions()
        );

        this.panel.onDidDispose(() => {
            this.hideStatus();
            this.panel.dispose();
            vscode.window.showErrorMessage('CLOSED');
        });

        this.panel.onDidChangeViewState((event) => {
            const actived = event.webviewPanel.active;
            if (actived) {
                this.showStatus();
            } else {
                this.hideStatus();
            }
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

    abstract getHtml(): string;
    abstract onArg(arg: any): Promise<void>;
}