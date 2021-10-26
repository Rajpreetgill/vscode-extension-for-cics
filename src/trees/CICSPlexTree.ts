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

import { TreeItemCollapsibleState, TreeItem, window, ProgressLocation } from "vscode";
import { CICSRegionTree } from "./CICSRegionTree";
import { join } from "path";
import { ProfileManagement } from "../utils/profileManagement";
import { IProfileLoaded } from "@zowe/imperative";
import { CICSSessionTree } from "./CICSSessionTree";
import { CICSTree } from "./CICSTree";

export class CICSPlexTree extends TreeItem {
  children: CICSRegionTree[] = [];
  plexName: string;
  profile: IProfileLoaded;
  parent: CICSSessionTree;

  constructor(
    plexName: string,
    profile: IProfileLoaded,
    sessionTree: CICSSessionTree,
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
    super(plexName, TreeItemCollapsibleState.Collapsed);
    this.plexName = plexName;
    this.profile = profile;
    this.parent = sessionTree;
    this.contextValue = `cicsplex.${plexName}`;
  }

  public addRegion(region: CICSRegionTree) {
    this.children.push(region);
  }

  public async filterRegions(pattern: string, tree: CICSTree) {
    this.children = [];
    const patternList = pattern.split(",");
    let patternString = "";
    for (const index in patternList) {
      patternString += `(^${patternList[index].replace("*","(.*)")})`;
      if (parseInt(index) !== patternList.length-1) {
        patternString += "|";
      }
    }
    const regex = new RegExp(patternString);
    this.label = pattern === "*" ? `${this.plexName}` : `${this.plexName} (${pattern})`;

    window.withProgress({
      title: 'Filtering regions',
      location: ProgressLocation.Notification,
      cancellable: true
    }, async (_, token) => {
      token.onCancellationRequested(() => {
        console.log("Cancelling the filter");
      });
      const plexInfo = await ProfileManagement.getPlexInfo(this.profile);
      for (const item of plexInfo) {
        for (const regionInPlex of item.regions) {
            if (regionInPlex.cicsname.match(regex)){
              const newRegionTree = new CICSRegionTree(
                regionInPlex.cicsname, 
                regionInPlex, 
                this.parent, 
                this);
              this.addRegion(newRegionTree);
              tree._onDidChangeTreeData.fire(undefined);
            }
        }
      }
      if (!this.children.length){
        window.showInformationMessage(`No regions found for ${this.plexName}`);
      }
    });
    
    
  }

  public getPlexName() {
    return this.plexName;
  }
}
