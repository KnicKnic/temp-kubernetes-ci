$url_file = "https://github.com/KnicKnic/k3s/releases/download/files2/files.zip"

# $work_dir = $env:GITHUB_WORKSPACE
$drive = Split-Path $pwd -Qualifier
$work_dir = join-path $drive tmp knicknic temp-kubernetes-ci
$k3s_path = join-path $work_dir "k3s.exe"
$k3s_tmp_dir = join-path $work_dir "k3s_tmp"
$logs_file = join-path $k3s_tmp_dir "logs.txt"
$zip_file = join-path $work_dir "files.zip"

function logMessage($msg){
    $str = "{0} logMessage {1}" -f $(get-date), $msg
    echo $str
}


logMessage "start download"

curl.exe -s -L -o $zip_file $url_file

logMessage "start extract"
Expand-Archive -Path $zip_file -DestinationPath $work_dir

$env:Path += ";$work_dir"



mkdir /etc -ErrorAction SilentlyContinue
mkdir $k3s_tmp_dir -ErrorAction SilentlyContinue


#setup environment
echo """
nameserver 8.8.8.8
""" > /etc/resolv.conf


logMessage "Get Ip info"

ipconfig /all

$hostNetwork = get-NetIPAddress -InterfaceAlias "Ethernet"| ?{$_.AddressFamily -eq "IPv4"}
$env:hostIp = $hostNetwork.IpAddress
$env:hostCidr = "{0}/{1}" -f $hostNetwork.IpAddress, $hostNetwork.PrefixLength


#for host-gw
#eventually need to get rid of KUBE_NETWORK
$env:KUBE_NETWORK="cbr0"

# Ideally I would directly launch k3s like 2 lines below, however when I do, pwsh gets wedged
start-process "pwsh.exe" -ArgumentList @("-command", "$k3s_path server -d $k3s_tmp_dir  --flannel-backend host-gw --docker --disable-network-policy --pause-image mcr.microsoft.com/k8s/core/pause:1.0.0 --disable servicelb,traefik,local-storage,metrics-server 2>&1 > $logs_file")

# $arguments = "server -d $k3s_tmp_dir  --flannel-backend host-gw --docker --disable-network-policy --pause-image mcr.microsoft.com/k8s/core/pause:1.0.0 --disable servicelb,traefik,local-storage,metrics-server".Split()
# start-process $k3s_path -ArgumentList $arguments -RedirectStandardError $logs_file


foreach ($seconds in 1..120) {
    logMessage "waiting for ~/.kube/k3s.yaml"
    $found = test-path "~/.kube/k3s.yaml"
    sleep 1; # always sleep (?give time for file to flush?)
    if($found)
    {
        break;
    }
}

logMessage "copying kubeconfig"

copy "~/.kube/k3s.yaml" "~/.kube/config"

foreach ($seconds in 1..120) {
    $empty = kubectl get node $([Environment]::MachineName)
    if($LASTEXITCODE -eq 0)
    {
        break;
    }
    sleep 1;
}

logMessage "node exists"


# test for 120 to see if node will go ready
kubectl wait --timeout=120s --for=condition=Ready node/$([Environment]::MachineName)

logMessage "node ready"

# wait till default serviceacount was created
foreach($retries in 1..120){
    kubectl get serviceaccount default
    if($LASTEXITCODE -eq 0){
        break
    }
}

logMessage "default serviceaccount created"

type $logs_file

kubectl get node

logMessage "done"
