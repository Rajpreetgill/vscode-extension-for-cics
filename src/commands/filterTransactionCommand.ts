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

import { commands, ProgressLocation, TreeView, window } from "vscode";
import { CICSTransactionTree } from "../trees/CICSTransactionTree";
import { CICSTree } from "../trees/CICSTree";
import { getPatternFromFilter } from "../utils/filterUtils";
import { PersistentStorage } from "../utils/PersistentStorage";

export function getFilterTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand(
    "cics-extension-for-zowe.filterTransactions",
    async (node) => {
      const selection = treeview.selection;
      let chosenNode: CICSTransactionTree;
      if (node) {
        chosenNode = node;
      } else if (selection[selection.length-1] && selection[selection.length-1] instanceof CICSTransactionTree) {
        chosenNode = selection[selection.length-1];
      } else { 
        window.showErrorMessage("No CICS transaction tree selected");
        return;
      }
      const persistentStorage = new PersistentStorage("zowe.cics.persistent");
      const pattern = await getPatternFromFilter("Transaction", persistentStorage.getTransactionSearchHistory());
      if (!pattern) {
        return;
      }
      await persistentStorage.addTransactionSearchHistory(pattern!);
      chosenNode.setFilter(pattern!);
      window.withProgress({
        title: 'Loading Transactions',
        location: ProgressLocation.Notification,
        cancellable: false
      }, async (_, token) => {
        token.onCancellationRequested(() => {
          console.log("Cancelling the loading of transactions");
        });
        await chosenNode.loadContents();
        tree._onDidChangeTreeData.fire(undefined);
      });
    }
  );
}
