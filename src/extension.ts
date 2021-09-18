'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "autoscrolldown" is now active!');

    let autoscroller = new Autoscroller();

    context.subscriptions.push(autoscroller);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let autoscrollCurrent = vscode.commands.registerCommand('extension.autoscrollDown', () => {
        if (vscode.window.activeTextEditor) {
            autoscroller.toggleWatch(vscode.window.activeTextEditor.document.fileName);
        } else {
            vscode.window.showWarningMessage('Active text editor not found.');
        }
    });

    context.subscriptions.push(autoscrollCurrent);
}

export class Autoscroller {
    private _disponsable: vscode.Disposable;
    private _watchedFiles: Set<string>;
    private _backgroundWatchedFiles: Set<string>;
    private _currentFile: string;
    private _statusBarItem: vscode.StatusBarItem;
    private _focused: boolean;
    private _atEndOfDocument: boolean;

    constructor() {
        this._watchedFiles = new Set<string>();
        this._backgroundWatchedFiles = new Set<string>();

        const editor = vscode.window.activeTextEditor;
        const document = editor?.document;

        this._currentFile = document?.fileName;
        this._focused = true;

        // Display the initial autoscrolldown status bar arrow.
        const selectionEnd = editor?.selections[0].end;
        const endPosition = document?.lineAt(document.lineCount - 1).range.end;
        this._atEndOfDocument = selectionEnd?.isAfterOrEqual(endPosition);
        if (this._isAutoscrollable(this._currentFile)) {
            this._showStatusBar();
        } else {
            this._hideStatusBar();
        }

        const subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeWindowState(this._onFocusChanged, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onChangeActiveTextEditor, this, subscriptions);
        vscode.window.onDidChangeTextEditorSelection(this._onSelectionChanged, this, subscriptions);
        vscode.workspace.onDidChangeTextDocument(this._onDocumentChanged, this, subscriptions);

        this._disponsable = vscode.Disposable.from(...subscriptions);
    }

    public watch(fileName: string) {
        this._watchedFiles.add(fileName);
    }

    public unwatch(fileName: string) {
        this._watchedFiles.delete(fileName);
    }

    public toggleWatch(fileName: string) {
        if (this._watchedFiles.has(fileName)) {
            this.unwatch(fileName);
        } else {
            this.watch(fileName);
        }

        if (this._isAutoscrollable(fileName)) {
            this._showStatusBar();
        } else {
            this._hideStatusBar();
        }
    }

    private _showStatusBar() {
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this._statusBarItem.text = `$(arrow-down)`;
        }

        if (this._isAlwaysAutoscroll()) {
            this._statusBarItem.tooltip = 'autoscrolldown: ready to scroll to the end of the file on change (global)';
            this._statusBarItem.command = undefined;
        } else {
            this._statusBarItem.tooltip = 'autoscrolldown: ready to scroll to the end of the file on change (toggle)';
            this._statusBarItem.command = 'extension.autoscrollDown';
        }

        this._statusBarItem.show();
    }

    private _hideStatusBar() {
        if (this._statusBarItem) {
            this._statusBarItem.hide();
        }
    }

    private _onDocumentChanged(e: vscode.TextDocumentChangeEvent) {
        const changedName = e.document.fileName;
        const currentName = vscode.window.activeTextEditor.document.fileName;
        
        // When switching the tab back will always scroll into view a document that previously autoscrolled
        const returningToWatched = this._backgroundWatchedFiles.has(changedName);
        
        if ((this._hasAutoscrollActive() || returningToWatched || !this._focused) && this._isAutoscrollable(changedName) && changedName === currentName) {
            this._scrollActiveEditorToEnd();
            if (returningToWatched) {
                this._backgroundWatchedFiles.delete(changedName);
            }
        }
    }

    private _onFocusChanged(e: vscode.WindowState) {
        this._focused = e.focused;
    }

    private _onChangeActiveTextEditor(e: vscode.TextEditor) {
        if (this._statusBarItem) {
            this._statusBarItem.hide();
        }
        if (this._isAutoscrollable(this._currentFile)) {
            this._backgroundWatchedFiles.add(this._currentFile);
        }
        if (e?.document.fileName) {
            this._currentFile = e.document.fileName;
        }
    }

    private _onSelectionChanged(e: vscode.TextEditorSelectionChangeEvent) {
        const document = vscode.window.activeTextEditor.document;
        const selectionEnd = e.selections[0].end;
        const endPosition = document.lineAt(document.lineCount - 1).range.end;
        this._atEndOfDocument = selectionEnd.isAfterOrEqual(endPosition);

        if (this._isAutoscrollable(document.fileName)) {
            this._showStatusBar();
        } else {
            this._hideStatusBar();
        }
    }

    private _isAutoscrollable(fileName: string): boolean {
        return (this._isAlwaysAutoscroll() || this._watchedFiles.has(fileName))
            && (this._atEndOfDocument || !this._hasToBeAtTheEnd());
    }

    private _scrollActiveEditorToEnd() {
        const editor = vscode.window.activeTextEditor;
        const lineCount = editor.document.lineCount;
        const range = editor.document.lineAt(lineCount - 1).range;
        editor.selection = new vscode.Selection(range.end, range.end);
        editor.revealRange(range);
    }

    private _getConfig(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration('autoscrolldown');
    }

    private _isAlwaysAutoscroll(): boolean {
        const settings = this._getConfig();
        return settings.get('allFiles', false);
    }

    private _hasToBeAtTheEnd(): boolean {
        const settings = this._getConfig();
        return settings.get('onlyWhenAtEnd', true);
    }

    private _hasAutoscrollActive(): boolean {
        if (this._backgroundWatchedFiles.has(this._currentFile)) {
            // Switching back to an autoscroll tab whose document has changed in the meanwhile.
            this._backgroundWatchedFiles.delete(this._currentFile);
            return true;
        }
        const settings = this._getConfig();
        return settings.get('alsoAutoscrollActive', false);
    }

    dispose() {
        this._disponsable.dispose();
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
