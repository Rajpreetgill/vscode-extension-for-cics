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
import { CICSRegionTree } from "./CICSRegionTree";
import { join } from "path";
import { CICSPlexTree } from "./CICSPlexTree";
import { Session } from "@zowe/imperative";

export class CICSSessionTree extends TreeItem {
  children: (CICSPlexTree | CICSRegionTree)[];
  session: Session;

  constructor(
    profile: any,
    public readonly iconPath = {
      light: join(
        __filename,
        "..",
        "..",
        "resources",
        "imgs",
        "profile-dark.svg"
      ),
      dark: join(
        __filename,
        "..",
        "..",
        "resources",
        "imgs",
        "profile-light.svg"
      ),
    }
  ) {
    super(profile.name, TreeItemCollapsibleState.Collapsed);
    this.children = [];
    this.contextValue = `cicssession.${profile.name}`;
    this.session = new Session({
      type: "basic",
      hostname: profile.profile!.host,
      port: Number(profile.profile!.port),
      user: profile.profile!.user,
      password: profile.profile!.password,
      rejectUnauthorized: profile.profile!.rejectUnauthorized,
      protocol: profile.profile!.protocol,
    });
  }

  public addRegion(region: CICSRegionTree) {
    this.children.push(region);
  }

  public addPlex(plex: CICSPlexTree) {
    this.children.push(plex);
  }
}
