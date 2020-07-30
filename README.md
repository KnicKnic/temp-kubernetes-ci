[![test](https://github.com/KnicKnic/temp-kubernetes-ci/workflows/test/badge.svg?branch=master&event=push)](https://github.com/KnicKnic/temp-kubernetes-ci/actions?query=workflow%3Atest+branch%3Amaster+event%3Apush)

# Goal

Create a github action to allow a user to create a kubernetes cluster in their github actions and include it in the actions market place for both linux & windows.

## Usage

For linux you can reference [k3s environment variables](https://rancher.com/docs/k3s/latest/en/installation/install-options/how-to-flags/) on setting additional parameters

### GitHub Action

```yaml
    - uses: knicknic/temp-kubernetes-ci@v1
```

### Other CI platform

Simply copy the below code snippet to get the latest version of the code

#### Linux

```bash
releaseVersion=$(curl --silent "https://api.github.com/repos/knicknic/temp-kubernetes-ci/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")')
curl -sSL "https://github.com/KnicKnic/temp-kubernetes-ci/releases/download/$releaseVersion/linux.sh" | sh
```

#### Windows

```powershell
$request = [System.Net.WebRequest]::Create('https://github.com/KnicKnic/temp-kubernetes-ci/releases/latest')
$response = $request.GetResponse()
$tag = $response.ResponseUri.OriginalString.split('/')[-1]
$url =  "https://github.com/KnicKnic/temp-kubernetes-ci/releases/download/$tag/windows.ps1"
$filePath = join-path $env:temp windows.ps1
Invoke-WebRequest -Uri $url -OutFile $filePath
& $filePath
```

## Why

When dealing with kubernetes you end up wanting to test against an actual kubernetes cluster.

1. Test your deployment files / helm charts actually deploy your app correctly
1. Test the controller you wrote against an actual kubernetes api server

## Source

| file        | description                                                                   |
|-------------|-------------------------------------------------------------------------------|
| index.js    | determines what os and launches either linux.sh or windows.ps1 to install k3s |
| linux.sh    | script to install k3s on linux                                                |
| windows.ps1 | script to install k3s on windows                                              |

## Tasks

1. ~~Figure out how to install k3s on linux and write a script to do so~~
1. ~~Figure out how to install k3s on windows and write a script to do so~~
    1. ~~See https://github.com/rancher/k3s/issues/1618 for some info & a branch to start from~~
1. ~~Convert script to Github Action~~
    1. ~~https://docs.github.com/en/actions/creating-actions/publishing-actions-in-github-marketplace~~
1. Convert script to azure devops custom task - see https://docs.microsoft.com/en-us/azure/devops/extend/develop/integrate-build-task?view=azure-devops
    1. Find out if there is a market place for custom tasks like their is for github actions
1. Write a dynamic storage provisioner for windows folders (enables windows to fufill PVCs)
    1. take https://github.com/KnicKnic/K8s-Storage-Plugins/tree/new_new and add a flexprovisioner & flexvolume that are just windows folders
    1. take https://github.com/rancher/local-path-provisioner and get that to work with windows
        1. This will also probably require csi proxy, which we could embed into k3s or run standalone
1. Write a load balancer for windows, equivalent of https://github.com/rancher/klipper-lb
1. Integrate linux with k3d to allow multiple linux nodes for a more realistic user scenario

## Hackathon

* Monday, July 27, 9:00 am local time: Kickoff/Hacking begins
* Tuesday, July 28: Hacking continues
* Wednesday, July 29, 5:00 pm local time: Hacking ends
* Thursday, July 30, 11:59 pm local time: Video upload deadline
    * The main deliverable for project teams is a 1-3 minute video describing your idea and project outcomes.



## Developer instructions

### Setup Environment

```pwsh
npm i -g @zeit/ncc
npm install
```

### Update project

```pwsh
ncc build index.js
```
