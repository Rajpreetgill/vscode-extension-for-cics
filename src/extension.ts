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

import { getDisableProgramCommand } from "./commands/disableProgramCommand";
import { getRemoveSessionCommand } from "./commands/removeSessionCommand";
import { getEnableProgramCommand } from "./commands/enableProgramCommand";
import { getAddSessionCommand } from "./commands/addSessionCommand";
import { getNewCopyCommand } from "./commands/newCopyCommand";
import { ExtensionContext, TreeItemCollapsibleState, window } from "vscode";
import { getPhaseInCommand } from "./commands/phaseInCommand";
import {
  getShowAttributesCommand,
  getShowRegionAttributes,
} from "./commands/showAttributesCommand";
import { getFilterProgramsCommand } from "./commands/filterProgramsCommand";
import { ProfileManagement } from "./utils/profileManagement";
import { CICSTree } from "./trees/CICSTree";
import { getShowTransactionAttributesCommand } from "./commands/showTransactionAttributesCommand";
import { getShowLocalFileAttributesCommand } from "./commands/showLocalFileAttributesCommand";
import { getFilterTransactionCommand } from "./commands/filterTransactionCommand";
import { getClearProgramFilterCommand } from "./commands/clearProgramFilterCommand";
import { getFilterLocalFilesCommand } from "./commands/filterLocalFileCommand";
import { getFilterPlexResources } from "./commands/getFilterPlexResources";
import { getClearPlexFilterCommand } from "./commands/clearPlexFilterCommand";
import { getRefreshCommand } from "./commands/refreshCommand";
import { getUpdateSessionCommand } from "./commands/updateSessionCommand";
import { getDeleteSessionCommand } from "./commands/deleteSessionCommand";
import { getDisableTransactionCommand } from "./commands/disableTransactionCommand";
import { getEnableTransactionCommand } from "./commands/enableTransactionCommand";
import { getEnableLocalFileCommand } from "./commands/enableLocalFileCommand";
import { getDisableLocalFileCommand } from "./commands/disableLocalFileCommand";
import { getCloseLocalFileCommand } from "./commands/closeLocalFileCommand";
import { getOpenLocalFileCommand } from "./commands/openLocalFileCommand";
import { CICSRegionTree } from "./trees/CICSRegionTree";
import { CICSSessionTree } from "./trees/CICSSessionTree";
import { join } from "path";
import { getResource } from "@zowe/cics-for-zowe-cli";
import * as https from "https";

export async function activate(context: ExtensionContext) {

  if (ProfileManagement.apiDoesExist()) {
    try {
      await ProfileManagement.registerCICSProfiles();
      ProfileManagement.getProfilesCache().registerCustomProfilesType('cics');
      await ProfileManagement.getExplorerApis().getExplorerExtenderApi().reloadProfiles();
      window.showInformationMessage(
        "Zowe Explorer was modified for the CICS Extension"
      );
    } catch (error) {
      console.log(error);
    }
  }

  const treeDataProv = new CICSTree();
  const treeview = window
    .createTreeView("cics-view", {
      treeDataProvider: treeDataProv,
      showCollapseAll: true,
      canSelectMany: true
    });

  treeview.onDidExpandElement(async (node) => {
    if (node.element.contextValue.includes("cicssession.")) {
      let profile : any;
      try {
        profile = await ProfileManagement.getProfilesCache().loadNamedProfile(node.element.label?.toString()!, 'cics');
        await treeDataProv.loadProfile(profile, treeDataProv.getLoadedProfiles().indexOf(node.element), node.element);
      } catch (error) {
        console.log(error);
      }
    } else if (node.element.contextValue.includes("cicsplex.")) {
      try {
        const plexProfile = node.element.getProfile();
        if (plexProfile.profile.regionName && plexProfile.profile.cicsPlex) {
          // Store applied filters
          node.element.findResourceFilters();
          await node.element.loadOnlyRegion();
          await node.element.reapplyFilter();
        } else {
          const regionInfo = await ProfileManagement.getRegionInfoInPlex(node.element);
          if (regionInfo) {   
            node.element.findResourceFilters();
            node.element.clearChildren();  
            let activeCount = 0;
            let totalCount = 0;
            const regionFilterRegex = node.element.getActiveFilter() ? RegExp(node.element.getActiveFilter()) : undefined;
            for (const region of regionInfo) {
              if (!regionFilterRegex || region.cicsname.match(regionFilterRegex)) {
                const newRegionTree = new CICSRegionTree(region.cicsname, region, node.element.getParent(), node.element);
                node.element.addRegion(newRegionTree);
                totalCount += 1;
                if (region.cicsstate === 'ACTIVE') {
                  activeCount += 1;
                }
              }
            }
            node.element.setLabel(`${node.element.getPlexName()} [${activeCount}/${totalCount}]`);
            await node.element.reapplyFilter();
            // Keep plex open after label change
            node.element.collapsibleState = TreeItemCollapsibleState.Expanded;
          }
        }
        treeDataProv._onDidChangeTreeData.fire(undefined);
      } catch (error) {
        console.log(error);
        const newSessionTree = new CICSSessionTree(node.element.getParent().profile, {
          light: join(
            __filename,
            "..",
            "..",
            "resources",
            "imgs",
            "profile-disconnected-dark.svg"
          ),
          dark: join(
            __filename,
            "..",
            "..",
            "resources",
            "imgs",
            "profile-disconnected-light.svg"
          ),
        });
        treeDataProv.loadedProfiles.splice(treeDataProv.getLoadedProfiles().indexOf(node.element.getParent()), 1, newSessionTree);
        treeDataProv._onDidChangeTreeData.fire(undefined);
      }
    } else if (node.element.contextValue.includes("cicsregion.")) {
    } else if (node.element.contextValue.includes("cicstreeprogram.")) {
      await node.element.loadContents();
      treeDataProv._onDidChangeTreeData.fire(undefined);
      node.element.collapsibleState = TreeItemCollapsibleState.Expanded;
    } else if (node.element.contextValue.includes("cicstreetransaction.")) {
      await node.element.loadContents();
      treeDataProv._onDidChangeTreeData.fire(undefined);
      node.element.collapsibleState = TreeItemCollapsibleState.Expanded;
    } else if (node.element.contextValue.includes("cicstreelocalfile.")) {
      await node.element.loadContents();
      treeDataProv._onDidChangeTreeData.fire(undefined);
      node.element.collapsibleState = TreeItemCollapsibleState.Expanded;
    } else if (node.element.contextValue.includes("cicsprogram.")) {
    }
  });


  context.subscriptions.push(
    getAddSessionCommand(treeDataProv),
    getRemoveSessionCommand(treeDataProv, treeview),
    getUpdateSessionCommand(treeDataProv),
    getDeleteSessionCommand(treeDataProv, treeview),

    getRefreshCommand(treeDataProv),

    getNewCopyCommand(treeDataProv, treeview),
    getPhaseInCommand(treeDataProv, treeview),

    getEnableProgramCommand(treeDataProv, treeview),
    getDisableProgramCommand(treeDataProv, treeview),
    getEnableTransactionCommand(treeDataProv, treeview),
    getDisableTransactionCommand(treeDataProv, treeview),
    getEnableLocalFileCommand(treeDataProv, treeview),
    getDisableLocalFileCommand(treeDataProv, treeview),

    getCloseLocalFileCommand(treeDataProv, treeview),
    getOpenLocalFileCommand(treeDataProv, treeview),

    getShowRegionAttributes(),
    getShowAttributesCommand(),
    getShowTransactionAttributesCommand(),
    getShowLocalFileAttributesCommand(),

    getFilterProgramsCommand(treeDataProv),
    getFilterTransactionCommand(treeDataProv),
    getFilterLocalFilesCommand(treeDataProv),

    getFilterPlexResources(treeDataProv),

    getClearProgramFilterCommand(treeDataProv),
    getClearPlexFilterCommand(treeDataProv)
  );
}

export function deactivate() { }
