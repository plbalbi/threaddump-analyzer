const shell = require("shelljs")
var express = require('express');
var path = require('path');

var app = express();

app.get('/processes', function (req, res) {
    // Do not forward stdout to console
    var runningProcessesLines = shell.exec("jps -l", { silent: true }).stdout
    runningProcesses = runningProcessesLines.split("\n").map(runningProcessLine => {
        var splittedRunningProcessLine = runningProcessLine.split(" ")
        return {
            pid: parseInt(splittedRunningProcessLine[0]),
            name: splittedRunningProcessLine[1]
        }
    })
    runningProcesses = runningProcesses.filter(process => process.pid && process.name)
    res.send(runningProcesses);
});

app.get('/threaddump/:pid', (request, response) => {
    const pid = request.params.pid
    var threadDumpText = shell.exec("jstack -l " + pid, { silent: true }).stdout
    response.send(threadDumpText)
})

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + req.path));
});


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

