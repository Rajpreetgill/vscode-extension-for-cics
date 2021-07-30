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

import { TreeItemCollapsibleState, TreeItem } from "vscode";
import { join } from "path";
import { CICSTransactionTreeItem } from "./treeItems/CICSTransactionTreeItem";
import { CICSRegionTree } from "./CICSRegionTree";
import { getResource } from "@zowe/cics-for-zowe-cli";

export class CICSTransactionTree extends TreeItem {
  children: CICSTransactionTreeItem[] = [];
  parentRegion: CICSRegionTree;
  activeFilter: string | undefined = undefined;

  constructor(
    parentRegion: CICSRegionTree,
    public readonly iconPath = {
      light: join(
        __filename,
        "..",
        "..",
        "..",
        "resources",
        "imgs",
        "list-dark.svg"
      ),
      dark: join(
        __filename,
        "..",
        "..",
        "..",
        "resources",
        "imgs",
        "list-light.svg"
      ),
    }
  ) {
    super('Transactions', TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicstransactiontree.${this.activeFilter ? 'filtered' : 'unfiltered'}.transactions`;
    this.parentRegion = parentRegion;
  }

  public addTransaction(program: CICSTransactionTreeItem) {
    this.children.push(program);
  }

  public async loadContents() {
    try {
      const transactionResponse = await getResource(this.parentRegion.parentSession.session, {
        name: "CICSLocalTransaction",
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex!.getPlexName() : undefined,
      });
      this.children = [];
      for (const transaction of transactionResponse.response.records.cicslocaltransaction) {
        if (!this.activeFilter) {
          const newTransactionItem = new CICSTransactionTreeItem(transaction, this.parentRegion);
          //@ts-ignore
          this.addTransaction(newTransactionItem);
        } else {
          const regex = new RegExp(this.activeFilter.toUpperCase());
          if (regex.test(transaction.tranid)) {
            const newTransactionItem = new CICSTransactionTreeItem(transaction, this.parentRegion);
            //@ts-ignore
            this.addTransaction(newTransactionItem);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.contextValue = `cicstransactiontree.${this.activeFilter ? 'filtered' : 'unfiltered'}.transactions`;
    this.label = `Transactions`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.contextValue = `cicstransactiontree.${this.activeFilter ? 'filtered' : 'unfiltered'}.transactions`;
    this.label = `Transactions (${this.activeFilter})`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }
}
