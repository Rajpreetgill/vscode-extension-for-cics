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

import { programNewcopy } from "@zowe/cics-for-zowe-cli";
import { commands, window } from "vscode";
import { CICSTree } from "../trees/CICSTree";

export function getNewCopyCommand(tree: CICSTree) {
  return commands.registerCommand(
    "cics-extension-for-zowe.newCopyProgram",
    async (node) => {
      if (node) {
        try {
          const response = await programNewcopy(
            node.parentRegion.parentSession.session,
            {
              name: node.program.program,
              regionName: node.parentRegion.label,
              cicsPlex: node.parentRegion.parentPlex ? node.parentRegion.parentPlex.plexName : undefined,
            }
          );
          window.showInformationMessage(
            `New Copy Count for ${node.label} = ${response.response.records.cicsprogram.newcopycnt}`
          );
        } catch (err) {
          window.showErrorMessage(err);
        }
      } else {
        window.showErrorMessage("No CICS program selected");
      }
    }
  );
}
