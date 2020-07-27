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


let fileExtensions = {cmd: '.cmd', pwsh: '.ps1', powershell: '.ps1'}
let builtInShells = {
    bash: 'bash --noprofile --norc -eo pipefail {0}', 
    pwsh: 'pwsh -command "& \'{0}\'"',
    python: 'python {0}',
    sh: 'sh -e {0}',
    cmd: '%ComSpec% /D /E:ON /V:OFF /S /C "CALL "{0}""',
    powershell: 'powershell -command "& \'{0}\'"',
    }

let linuxCommand = `echo "asfd"
curl -sfL https://get.k3s.io | sh -s - --docker
mkdir ~/.kube || echo "~/.kube already existed"
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chmod 777 ~/.kube/config
# systemctl status k3s
# sleep 15
cat ~/.kube/config
kubectl get node`

linuxShell = 'bash'

async function body() {
    try{
        let command =  '';
        let unformattedShell = '';

        let file = path.join(process.env.GITHUB_WORKSPACE, uuidv4())

        // https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#using-a-specific-shell
        
        let platform = os.platform()
        // if(platform == 'darwin'){
        //     command = core.getInput('macos')
        //     unformattedShell = core.getInput('macosShell')
        // }
        
        if(platform == 'linux'){
            command = linuxCommand
            unformattedShell = linuxShell
        } else{
            core.setFailed("Unsupported os " + platform)   
        }     
        // else if (platform == 'win32'){
        //     command = core.getInput('windows');
        //     unformattedShell = core.getInput('windowsShell')
        // }    

            
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

