# Zowe CICS Explorer

[![version](https://vsmarketplacebadge.apphb.com/version-short/zowe.zowe-explorer-cics-extension.svg)](https://vsmarketplacebadge.apphb.com/version-short/zowe.zowe-explorer-cics-extension.svg)
[![downloads](https://vsmarketplacebadge.apphb.com/downloads-short/zowe.zowe-explorer-cics-extension.svg)](https://vsmarketplacebadge.apphb.com/downloads-short/zowe.zowe-explorer-cics-extension.svg)
[![slack](https://img.shields.io/badge/chat-on%20Slack-blue)](https://openmainframeproject.slack.com/archives/CUVE37Z5F)

This CICS Extension for Zowe Explorer adds additional functionality to the popular VSCode extension, [Zowe Explorer](https://github.com/zowe/vscode-extension-for-zowe). This extension allows interactions with CICS regions and programs, and the ability to run commands against them.

## Features

- Load profiles directly from Zowe instance locally installed.
- Create new Zowe CICS profiles and connect to them.
- View multiple regions and programs within a plex in a comprehensible tree-like format .
- Perform actions such as `New Copy` and `Phase In` directly from the UI
- View attributes about the programs and regions by right-clicking

To Install CICS Extension for Zowe Explorer see [Installation](./docs/installation.md)

## Getting Started

### Create Profile

If you already have a Zowe CICS CLI profile the CICS tree will load this on startup.  

If you don't have an existing CICS profile add one by selecting the + button in the CICS tree and choosing the option `Create New Session ...` to open a panel allowing connection details to be defined.  The connection must point to a CICS region's CICS Management Client Interface (CMCI) TCP/IP host name and port number.  The region can be a WUI server in a CICSPlex, or else a stand-alone Single Management Application Programming (SMSS) region. 

To show more than one CICS profile in the tree, select the + button and choose from the list of profiles.  Only profiles not already included in the CICS tree will be shown.  To view all Zowe CICS CLI profiles use the command `zowe profiles list cics` from a terminal. 

<img src="./docs/images/create-profile.gif" alt="Zowe CICS Explorer profiles" width="700px"/> 

Expand a CICS profile to see the region name, and expand the region to view its programs.  If the CICS profile is connected to a CMAS region that is part of a CICSPlex, the tree will show all of the regions managed by the CICSPlex.  If the CICS profile is for an SMSS region then just one region will be shown.  

### CICS Programs

The list of programs shown in the tree excludes those that are IBM supplied (those starting CEE, DFH, CJ, EYU, CSQ, CEL or IGZ).  This is to narrow the tree to only include user programs.

To filter the list of programs select the manifying glass to the right of the region node in the tree.  This opens a dialog at the top of VS Code where you can enter a program filter criteria.  This can be an exact program name or else you can use wildcards.

<img src="./docs/images/filter-programs.gif" alt="Zowe CICS Explorer Filter Programs" width="700px"/> 

## Known Issues

## Release Notes

Major refactor from initial release. New UI features like icons and an updated tree view. Increased functionality with new and improved commands.

---
