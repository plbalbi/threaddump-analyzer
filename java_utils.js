const shell = require("shelljs")
var express = require('express');
var path = require('path');

var app = express();

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

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

app.get('/threaddump', (request, response) => {
    console.log("Not yet implemented")
})

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + req.path));
});


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

