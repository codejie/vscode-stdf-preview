import * as vscode from "vscode";
import { PreviewPanel, ProcessArgs } from "../preview-panels";
import ParamMapViewPanel from "../preview-panels/param-map-panel";
import ProfileViewPanel from "../preview-panels/profile-panel";
import RecordsViewPanel from "../preview-panels/records-panel";
import SBinMapViewPanel from "../preview-panels/sbin-map-panel";

export class STDFDocument extends vscode.Disposable implements vscode.CustomDocument {

    private panel?: PreviewPanel = undefined;

    constructor(protected readonly context: vscode.ExtensionContext, public readonly uri: vscode.Uri, protected openContext: vscode.CustomDocumentOpenContext) {
        super(() => { this.onDispose(); });
    }

    onDispose() {
        super.dispose();
    }

    analyse(process: vscode.Progress<ProcessArgs>, viewPanel: vscode.WebviewPanel): Promise<void> {
        const editor: string | undefined = vscode.workspace.getConfiguration('STDF.Preview').get('defaultPreviewEditor');

        switch (editor) {
            case 'Records Preview':
                this.panel = new RecordsViewPanel(this.context, viewPanel);
                break;
            case 'SoftBin Map Preview':
                this.panel = new SBinMapViewPanel(this.context, viewPanel);        
                break;
            case 'Parametric Map Preview':
                this.panel = new ParamMapViewPanel(this.context, viewPanel);
                break;
            default:
                this.panel = new ProfileViewPanel(this.context, viewPanel);
        }

        return this.panel!.onFile(process, this.uri.fsPath);
    }

    stopAnalyse() {
        if (this.panel) {
            this.panel.stop();
        }
    }
}
