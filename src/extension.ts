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
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let autoscrollCurrent = vscode.commands.registerCommand('extension.autoscrollDown', () => {
        autoscroller.toggleWatch(vscode.window.activeTextEditor.document.fileName);
    });

    context.subscriptions.push(autoscrollCurrent);
}

export class Autoscroller {
    private _disponsable: vscode.Disposable;
    private _watchedFiles: Set<string>;
    private _statusBarItem: vscode.StatusBarItem;

    constructor() {
        this._watchedFiles = new Set<string>();

        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeActiveTextEditor(this._onDocumentSwitched, this, subscriptions);
        vscode.workspace.onDidChangeTextDocument(this._onDocumentChanged, this, subscriptions);

        this._disponsable = vscode.Disposable.from(...subscriptions);
    }

    public watch(file: string) {
        this._watchedFiles.add(file);
    }

    public unwatch(file: string) {
        this._watchedFiles.delete(file);
    }

    public toggleWatch(file: string) {
        if (this._watchedFiles.has(file)) {
            this.unwatch(file);
            this._hideStatusBar();
        } else {
            this.watch(file);
            this._showStatusBar();
        }
    }

    private _showStatusBar() {
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this._statusBarItem.tooltip = 'autoscrolldown to end of file on change';
            this._statusBarItem.command = 'extension.autoscrollDown';    
        }

        this._statusBarItem.text = `$(arrow-down)`;
        this._statusBarItem.show();
    }

    private _hideStatusBar() {
        if (this._statusBarItem) {
            this._statusBarItem.hide();
        }
    }

    private _onDocumentChanged(e: vscode.TextDocumentChangeEvent) {
        let changedName = e.document.fileName;
        let currentName = vscode.window.activeTextEditor.document.fileName;
        if (this._watchedFiles.has(changedName) && changedName === currentName) {
            this._scrollActiveEditorToEnd();
        }
    }

    private _onDocumentSwitched(e: vscode.TextEditor) {
        if (this._watchedFiles.has(e.document.fileName)) {
            this._showStatusBar();
        } else {
            this._hideStatusBar();
        }
    }

    private _scrollActiveEditorToEnd() {
        let editor = vscode.window.activeTextEditor;
        let lineCount = editor.document.lineCount;
        let range = editor.document.lineAt(lineCount - 1).range;
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range);
    }

    dispose() {
        this._disponsable.dispose();
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
