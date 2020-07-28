const core = require('@actions/core');
const exec = require('@actions/exec');

const path = require('path');

// 'aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', and 'win32'.
const os = require('os');
const fs = require('fs');

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// add format because that seems to be how github does formatting
String.prototype.format = function () {
    var a = this;
    for (var k in arguments) {
        a = a.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
    }
    return a
}


// https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#using-a-specific-shell
let fileExtensions = {cmd: '.cmd', pwsh: '.ps1', powershell: '.ps1'}
let builtInShells = {
    bash: 'bash --noprofile --norc -eo pipefail {0}', 
    pwsh: 'pwsh -command "& \'{0}\'"',
    python: 'python {0}',
    sh: 'sh -e {0}',
    cmd: '%ComSpec% /D /E:ON /V:OFF /S /C "CALL "{0}""',
    powershell: 'powershell -command "& \'{0}\'"',
    }

let linuxScript = `
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
`

let linuxShell = 'bash'

let windowsScript = `
$url_file = "https://github.com/KnicKnic/k3s/releases/download/files2/files.zip"

$work_dir = $env:GITHUB_WORKSPACE
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
foreach($second in 1..120){
    $n = kubectl get node $([Environment]::MachineName) -o json | ConvertFrom-Json
    # not sure if there is a better way for testing that it went ready.. but this seems to work
    if(($n.status.conditions |?{$_.reason -eq "KubeletReady"} |%{$_.status} )-contains "True"){
        break
    }
    sleep 1;
}

logMessage "node ready"

type $logs_file

kubectl get node

logMessage "done"

# this is to ensure that everything settled (there are cases where default service accounts were not yet created)
sleep 2
`

let windowsShell = 'pwsh'

async function body() {
    try{
        let unformattedShell = ''
        let command = ''
        let file = path.join(process.env.GITHUB_WORKSPACE, uuidv4())
        
        let platform = os.platform()
        // if(platform == 'darwin'){
        //    command = macosScript
        //    unformattedShell = macosShell
        // }
        
        if(platform == 'linux'){
            command = linuxScript
            unformattedShell = linuxShell
        } 
        else if (platform == 'win32'){
            command = windowsScript
            unformattedShell = windowsShell
        }    else{
            core.setFailed("Unsupported os " + platform)   
        }     

        let fileExtension = fileExtensions[unformattedShell] || ''
        file = file+fileExtension
         
        let shell = builtInShells[unformattedShell] || unformattedShell
        let formattedShell = shell.format(file)

        fs.writeFileSync(file, command)
        core.info(`About to run command ${command}`)

        const error_code = await exec.exec(formattedShell);

        if(error_code != 0){
            core.setFailed(`Failed with error code ${error_code}`)
        }
    }catch(error){
        core.setFailed(error.message);
    }
}
body()

