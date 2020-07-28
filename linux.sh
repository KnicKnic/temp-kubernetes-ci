#!/bin/bash

curl -sfL https://get.k3s.io | sh -s - --docker
mkdir ~/.kube || echo "~/.kube already existed"
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chmod 777 ~/.kube/config
# systemctl status k3s
# sleep 15
cat ~/.kube/config

# ensure that node is created
sleep 2

# test for 120 to see if node will go ready
kubectl wait --timeout=120s --for=condition=Ready node/$HOSTNAME

# wait for 2m to see that default service gets created
timeout 2m bash -c 'until kubectl get serviceaccount default; do sleep 1; done'