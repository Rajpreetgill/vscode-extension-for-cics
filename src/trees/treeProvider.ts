import { ProfileStorage } from "../utils/profileStorage";
import { ProfilesCache } from "@zowe/zowe-explorer-api";
import { CICSProgramTreeItem } from "./CICSProgramTree";
import { CICSSessionTreeItem } from "./CICSSessionTree";
import { getResource } from "@zowe/cics-for-zowe-cli";
import { CICSRegionTreeItem } from "./CICSRegionTree";
import { CicsSession } from "../utils/CicsSession";
import {
  Session,
  IProfileLoaded,
  Logger,
  ISaveProfile,
} from "@zowe/imperative";
import {
  ProviderResult,
  window,
  TreeDataProvider,
  Event,
  EventEmitter,
  StatusBarItem,
  StatusBarAlignment,
  WebviewPanel,
} from "vscode";
import { join } from "path";

export class CICSTreeDataProvider
  implements TreeDataProvider<CICSSessionTreeItem> {
  async loadPrograms(element: CICSRegionTreeItem) {
    this.showStatusBarItem();
    window.showInformationMessage(
      `Retrieving Programs for Region ${element.region.applid}`
    );

    try {
      const programResponse = await getResource(element.parentSession.session, {
        name: "CICSProgram",
        regionName: element.region.applid,
        cicsPlex: element.parentSession.cicsPlex!,
        criteria:
          "NOT (PROGRAM=CEE* OR PROGRAM=DFH* OR PROGRAM=CJ* OR PROGRAM=EYU* OR PROGRAM=CSQ* OR PROGRAM=CEL* OR PROGRAM=IGZ*)",
        parameter: undefined,
      });

      const programs = programResponse.response.records.cicsprogram
        ? programResponse.response.records.cicsprogram
        : [];

      for (const program of programs) {
        const programTreeItem = new CICSProgramTreeItem(program, element);
        element.addProgramChild(programTreeItem);
      }

      element.iconPath = {
        light: join(
          __filename,
          "..",
          "..",
          "..",
          "resources",
          "imgs",
          "region-green.svg"
        ),
        dark: join(
          __filename,
          "..",
          "..",
          "..",
          "resources",
          "imgs",
          "region-green.svg"
        ),
      };
      window.showInformationMessage(`Programs Retrieved`);
    } catch (error) {
      window.showErrorMessage(error.message);
    } finally {
      this._onDidChangeTreeData.fire(undefined);
      this.hideStatusBarItem();
    }
  }
  removeSession(session: CICSSessionTreeItem) {
    try {
      window.showInformationMessage(`Removing Session ${session.label}`);
      this.sessionMap.delete(session.sessionName);
      this.refresh();
    } catch (error) {
      window.showErrorMessage(error.message);
    }
  }

  private _onDidChangeTreeData: EventEmitter<
    any | undefined
  > = new EventEmitter<any | undefined>();
  readonly onDidChangeTreeData: Event<any | undefined> = this
    ._onDidChangeTreeData.event;

  private sessionMap = new Map();
  private data: CICSSessionTreeItem[] | undefined = [];
  private statusBarItem: StatusBarItem;

  constructor() {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    this.statusBarItem.text = "Refreshing...";
    this.statusBarItem.tooltip = "Refreshing the current Zowe CICS tree";
    this.statusBarItem.hide();
  }

  public showStatusBarItem() {
    this.statusBarItem.show();
  }
  public hideStatusBarItem() {
    this.statusBarItem.hide();
  }

  async refresh(): Promise<void> {
    try {
      this.showStatusBarItem();
      let profileList = [];

      const listOfSessionTrees: CICSSessionTreeItem[] = [];

      for (const element of this.sessionMap) {
        const sessionName = element[0];
        const { session, cicsPlex, region } = element[1];

        const sessionTreeItem = new CICSSessionTreeItem(
          sessionName,
          session,
          cicsPlex
        );

        const getRegions = await getResource(session, {
          name: "CICSRegion",
          regionName: region!,
          cicsPlex: cicsPlex!,
          criteria: undefined,
          parameter: undefined,
        });

        const listOfRegions: any[] = !Array.isArray(
          getRegions.response.records.cicsregion
        )
          ? [getRegions.response.records.cicsregion]
          : getRegions.response.records.cicsregion;

        const regions = [];

        for (const region of listOfRegions) {
          const regionTreeItem = new CICSRegionTreeItem(
            region.applid,
            sessionTreeItem,
            region,
            []
          );

          sessionTreeItem.addRegionChild(regionTreeItem);

          regions.push({
            [region.applid]: [],
          });
        }

        listOfSessionTrees.push(sessionTreeItem);

        profileList.push({
          name: sessionName,
          session: session,
          regions: regions,
          cicsPlex: cicsPlex!,
        });
      }
      this.data = listOfSessionTrees;
      this._onDidChangeTreeData.fire(undefined);
      this.hideStatusBarItem();
    } catch (error) {
      window.showErrorMessage(error.message);
      this.hideStatusBarItem();
    }
  }

  public async loadExistingProfile(profile?: IProfileLoaded) {
    try {
      const session = new Session({
        type: "basic",
        hostname: profile!.profile!.host,
        port: Number(profile!.profile!.port),
        user: profile!.profile!.user,
        password: profile!.profile!.password,
        rejectUnauthorized: profile!.profile!.rejectUnauthorized,
        protocol: profile!.profile!.protocol,
      });

      let cicsPlex;
      let region;
      if (profile!.profile!.cicsPlex) {
        cicsPlex = profile!.profile!.cicsPlex;
        region = profile!.profile!.cicsPlex;
      } else {
        region = profile!.profile!.regionName;
      }

      const cicsSesison = new CicsSession(session, cicsPlex, region);
      this.sessionMap.set(profile!.name, cicsSesison);
    } catch (error) {
      window.showErrorMessage(error.message);
    } finally {
      await this.refresh();
    }
  }

  public async addSession() {
    /**
     * Event when 'Add Session' button is clicked...
     *
     * 1. Find Profiles that are not yet loaded...
     * 1.1. If exist, show quick pick...
     * 1.2. If not exist, show 'No profiles - Create one with Zowe CLI??'
     */

    const profileStorage = new ProfileStorage();

    if (profileStorage.getProfiles()) {
      const profilesFound = profileStorage
        .getProfiles()
        .filter((profile) => {
          if (!this.sessionMap.has(profile.name!)) {
            return true;
          }
          return false;
        })
        .map((profile) => {
          return { label: profile.name! };
        });

      if (profilesFound.length === 0) {
        window.showInformationMessage(
          "No Profiles Found... Create a CICS profile"
        );
        this.noProfiles();
      } else {
        const profileNameToLoad = await window.showQuickPick(profilesFound);

        if (profileNameToLoad) {
          window.showInformationMessage(
            `Loading CICS Profile (${profileNameToLoad.label})`
          );
          let profileToLoad;

          for (const prof of profileStorage.getProfiles()) {
            if (prof.name === profileNameToLoad.label) {
              profileToLoad = prof;
            }
          }

          this.loadExistingProfile(profileToLoad);
        } else {
          this.noProfiles();
        }
      }
    } else {
      window.showInformationMessage(
        "No Profiles Found... Create a CICS profile"
      );
      this.noProfiles();
    }
  }

  getTreeItem(
    element: CICSSessionTreeItem
  ): CICSSessionTreeItem | Thenable<CICSSessionTreeItem> {
    return element;
  }

  getChildren(element?: any | undefined): ProviderResult<any[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }

  noProfiles(): void {
    const column = window.activeTextEditor
      ? window.activeTextEditor.viewColumn
      : undefined;
    const panel: WebviewPanel = window.createWebviewPanel(
      "zowe",
      `Create Session`,
      column || 1,
      { enableScripts: true }
    );
    panel.webview.html = this.getWebViewHTML();

    panel.webview.onDidReceiveMessage(async (message) => {
      try {
        const session = new Session(message.session);

        const cicsSesison = new CicsSession(
          session,
          message.cicsPlex,
          message.region
        );
        this.sessionMap.set(message.name, cicsSesison);
        panel.dispose();

        const prof = new ProfilesCache(Logger.getAppLogger());
        const newProfile: ISaveProfile = {
          profile: {
            name: message.name,
            host: message.session.hostname,
            port: message.session.port,
            user: message.session.user,
            password: message.session.password,
            rejectUnauthorized: message.session.rejectUnauthorized,
            protocol: message.session.protocol,
            regionName: message.region,
            cicsPlex: message.cicsPlex,
          },
          name: message.name,
          type: "cics",
          overwrite: true,
        };

        await prof.getCliProfileManager("cics").save(newProfile);
      } catch (error) {
        window.showErrorMessage(error.message);
      } finally {
        await this.refresh();
      }
    });
  }

  getWebViewHTML(): string {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Add Session</title>
      </head>
      <style>
        :root {
          font-size: 16px;
        }
        * {
          padding: 0;
          margin: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--vscode-editor-background);
        }
        h1 {
          margin: 1.5rem 0;
          font-size: 2.6rem;
          color: var(--vscode-editor-foreground);
        }
        input, select {
          background-color: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          text-align: center;
          padding: 0.7rem 0;
          width: 70%;
          font-size: 1rem;
          border: 1px solid var(--vscode-editor-foreground);
          border-radius: 1rem;
        }
        .inputs {
          margin: 2rem 0;
          padding: 2rem 0;
          width: 80%;
          border: 1px solid var(--vscode-editor-foreground);
          border-radius: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          -webkit-box-shadow: 0px 0px 30px 6px rgba(238, 238, 238, 0.7);
          box-shadow: 0px 0px 30px 6px rgba(238, 238, 238, 0.7);
        }
        .input-container {
          display: flex;
          flex-direction: column;
          width: 80%;
          padding: 1rem 0;
        }
        .input-container > label {
          width: 100%;
          color: var(--vscode-editor-foreground);
          padding: 1rem 0;
          font-size: 1.2rem;
        }
        .input-container > input, 
        .input-container > select {
          width: 100%;
        }
        .inputs > button {
          width: 40%;
          padding: 0.5rem 0;
          font-size: 1.2rem;
        }
      </style>
      <body>
        <div class="inputs">
          <h1>Add Session</h1>
          <div class="input-container">
            <label for="sessionName">Name of the profile: </label>
            <input type="text" id="sessionName" />
          </div>
    
          <div class="input-container">
            <label for="sessionHost">Host: </label>
            <input type="text" id="sessionHost" />
          </div>
    
          <div class="input-container">
            <label for="sessionPort">Port: </label>
            <input type="text" id="sessionPort" />
          </div>
    
          <div class="input-container">
            <label for="sessionUser">User: </label>
            <input type="text" id="sessionUser" />
          </div>
    
          <div class="input-container">
            <label for="sessionPassword">Password: </label>
            <input type="password" id="sessionPassword" />
          </div>
    
          <div class="input-container">
            <label for="sessionRegion">Region: </label>
            <input type="text" id="sessionRegion" />
          </div>
    
          <div class="input-container">
            <label for="sessionCicsPlex">Cics Plex: </label>
            <input type="text" id="sessionCicsPlex" />
          </div>
    
          <div class="input-container">
            <label for="sessionProtocol">Protocol: </label>
            <select id="sessionProtocol">
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>
          <div class="input-container">
            <label for="sessionRejectUnauthorised"
              >Reject Unauthorised:
            </label>
            <select id="sessionRejectUnauthorised">
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
    
          <button onclick="createSession()">Create Profile</button>
        </div>
    
        <script>
          function createSession() {
            const session = {
              type: "basic",
              hostname: document.getElementById("sessionHost").value,
              port: parseInt(document.getElementById("sessionPort").value),
              user: document.getElementById("sessionUser").value,
              password: document.getElementById("sessionPassword").value,
              rejectUnauthorized:
                document.getElementById("sessionRejectUnauthorised").value ===
                "true"
                  ? true
                  : false,
              protocol: document.getElementById("sessionProtocol").value,
            };
            const data = {
              session: session,
              name: document.getElementById("sessionName").value,
              region: document.getElementById("sessionRegion").value,
              cicsPlex: document.getElementById("sessionCicsPlex").value,
            };
    
            const vscode = acquireVsCodeApi();
            vscode.postMessage(data);
          }
        </script>
      </body>
    </html>
    `;
  }
}
