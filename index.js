const core = require('@actions/core');
const exec = require('@actions/exec');

const path = require('path');

// 'aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', and 'win32'.
const os = require('os');
const fs = require('fs');


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

let linuxScriptName = path.join(process.env.GITHUB_WORKSPACE, "linux.sh")

let linuxShell = 'bash'

let windowsScriptName = path.join(process.env.GITHUB_WORKSPACE, "windows.ps1")

let windowsShell = 'pwsh'

async function body() {
    try{
        let unformattedShell = '';
        
        let platform = os.platform()
        // if(platform == 'darwin'){
        //     command = core.getInput('macos')
        //     unformattedShell = core.getInput('macosShell')
        // }
        
        if(platform == 'linux'){
            file = linuxScriptName
            unformattedShell = linuxShell
        } 
        else if (platform == 'win32'){
            file = windowsScriptName
            unformattedShell = windowsShell
        }    else{
            core.setFailed("Unsupported os " + platform)   
        }     

            
        let shell = builtInShells[unformattedShell] || unformattedShell
        let formattedShell = shell.format(file)

        core.info(`About to run command ${file}`)

        const error_code = await exec.exec(formattedShell);

        if(error_code != 0){
            core.setFailed(`Failed with error code ${error_code}`)
        }
    }catch(error){
        core.setFailed(error.message);
    }
}
body()

