"use strict";
/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const disableProgramCommand_1 = require("./commands/disableProgramCommand");
const removeSessionCommand_1 = require("./commands/removeSessionCommand");
const enableProgramCommand_1 = require("./commands/enableProgramCommand");
const addSessionCommand_1 = require("./commands/addSessionCommand");
const newCopyCommand_1 = require("./commands/newCopyCommand");
const vscode_1 = require("vscode");
const phaseInCommand_1 = require("./commands/phaseInCommand");
const showAttributesCommand_1 = require("./commands/showAttributesCommand");
const filterProgramsCommand_1 = require("./commands/filterProgramsCommand");
const profileManagement_1 = require("./utils/profileManagement");
const CICSTree_1 = require("./trees/CICSTree");
const showTransactionAttributesCommand_1 = require("./commands/showTransactionAttributesCommand");
const showLocalFileAttributesCommand_1 = require("./commands/showLocalFileAttributesCommand");
const filterTransactionCommand_1 = require("./commands/filterTransactionCommand");
const clearProgramFilterCommand_1 = require("./commands/clearProgramFilterCommand");
const filterLocalFileCommand_1 = require("./commands/filterLocalFileCommand");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (profileManagement_1.ProfileManagement.apiDoesExist()) {
            yield profileManagement_1.ProfileManagement.registerCICSProfiles();
            profileManagement_1.ProfileManagement.getProfilesCache().registerCustomProfilesType('cics');
            yield profileManagement_1.ProfileManagement.getExplorerApis().getExplorerExtenderApi().reloadProfiles();
            vscode_1.window.showInformationMessage("Zowe Explorer was modified for the CICS Extension");
        }
        const treeDataProv = new CICSTree_1.CICSTree();
        vscode_1.window
            .createTreeView("cics-view", {
            treeDataProvider: treeDataProv,
            showCollapseAll: true,
        })
            .onDidExpandElement((node) => {
            if (node.element.contextValue.includes("cicssession.")) {
            }
            else if (node.element.contextValue.includes("cicsplex.")) {
            }
            else if (node.element.contextValue.includes("cicsregion.")) {
                for (const child of node.element.children) {
                    child.loadContents();
                }
                treeDataProv._onDidChangeTreeData.fire(undefined);
            }
            else if (node.element.contextValue.includes("cicsprogram.")) {
            }
        });
        context.subscriptions.push(addSessionCommand_1.getAddSessionCommand(treeDataProv), removeSessionCommand_1.getRemoveSessionCommand(treeDataProv), 
        // getRefreshCommand(treeDataProv),
        newCopyCommand_1.getNewCopyCommand(treeDataProv), phaseInCommand_1.getPhaseInCommand(treeDataProv), enableProgramCommand_1.getEnableProgramCommand(treeDataProv), disableProgramCommand_1.getDisableProgramCommand(treeDataProv), showAttributesCommand_1.getShowRegionAttributes(), showAttributesCommand_1.getShowAttributesCommand(), showTransactionAttributesCommand_1.getShowTransactionAttributesCommand(), showLocalFileAttributesCommand_1.getShowLocalFileAttributesCommand(), filterProgramsCommand_1.getFilterProgramsCommand(treeDataProv), filterTransactionCommand_1.getFilterTransactionCommand(treeDataProv), filterLocalFileCommand_1.getFilterLocalFilesCommand(treeDataProv), clearProgramFilterCommand_1.getClearProgramFilterCommand(treeDataProv));
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map