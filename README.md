# Goal

Create a github action to allow a user to create a kubernetes cluster in their github actions and include it in the actions market place for both linux & windows.

## Why

When dealing with kubernetes you end up wanting to test against an actual kubernetes cluster.

1. Test your deployment files / helm charts actually deploy your app correctly
1. Test the controller you wrote against an actual kubernetes api server

## Tasks

1. Figure out how to install k3s on linux and write a script to do so
1. Figure out how to install k3s on windows and write a script to do so
    1. See https://github.com/rancher/k3s/issues/1618 for some info & a branch to start from
1. Convert script to Github Action
    1. https://docs.github.com/en/actions/creating-actions/publishing-actions-in-github-marketplace
1. Convert script to azure devops custom task - see https://docs.microsoft.com/en-us/azure/devops/extend/develop/integrate-build-task?view=azure-devops
    1. Find out if there is a market place for custom tasks like their is for github actions
1. Write a dynamic storage provisioner for windows folders (enables windows to fufill PVCs)
    1. take https://github.com/KnicKnic/K8s-Storage-Plugins/tree/new_new and add a flexprovisioner & flexvolume that are just windows folders
    1. take https://github.com/rancher/local-path-provisioner and get that to work with windows
        1. This will also probably require csi proxy, which we could embed into k3s or run standalone
1. Integrate linux with k3d to allow multiple linux nodes for a more realistic user scenario

## Hackathon

* Monday, July 27, 9:00 am local time: Kickoff/Hacking begins
* Tuesday, July 28: Hacking continues
* Wednesday, July 29, 5:00 pm local time: Hacking ends
* Thursday, July 30, 11:59 pm local time: Video upload deadline
    * The main deliverable for project teams is a 1-3 minute video describing your idea and project outcomes.
