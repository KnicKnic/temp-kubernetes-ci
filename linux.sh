#!/bin/bash

curl -sfL https://get.k3s.io | sh -s - --docker
mkdir ~/.kube || echo "~/.kube already existed"
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chmod 777 ~/.kube/config
# systemctl status k3s
# sleep 15
cat ~/.kube/config

# this is to ensure that everything settled (there are cases where default service accounts were not yet created)
sleep 4

kubectl get node