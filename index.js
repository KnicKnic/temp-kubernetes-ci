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

let linuxScriptName = 'linux.sh'

let linuxShell = 'bash'

let windowsScriptName = 'windows.ps1'

let windowsShell = 'pwsh'

async function body() {
    try{
        let unformattedShell = ''
        let command = ''
        let file = path.resolve(__dirname , '..') // '..' because we are in dist/index.js
        core.info(`folder with modules ${file}`)
        
        let platform = os.platform()
        // if(platform == 'darwin'){
        //    command = macosScript
        //    unformattedShell = macosShell
        // }

        if(platform == 'linux'){
            file = path.join(file, linuxScriptName)
            unformattedShell = linuxShell
        } 
        else if (platform == 'win32'){
            file = path.join(file, windowsScriptName)
            unformattedShell = windowsShell
        }    else{
            core.setFailed("Unsupported os " + platform)   
        }     
         
        let shell = builtInShells[unformattedShell] || unformattedShell
        let formattedShell = shell.format(file)

        core.info(`About to run file ${file}`)

        const error_code = await exec.exec(formattedShell);

        if(error_code != 0){
            core.setFailed(`Failed with error code ${error_code}`)
        }
    }catch(error){
        core.setFailed(error.message);
    }
}
body()

