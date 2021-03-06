var http = require('http');
var fs = require('fs');
var mongo = require('mongodb');
var csv = require('csv-parser')
var querystring = require("querystring");
var express = require('express');
var app = express();

const hostname = 'localhost';
var port = process.env.PORT || 8080;
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'html');

app.get('/', function(req, res) {
    file = "index.html";
    fs.readFile(file, function(err, txt) {
        res.writeHead(200, {'Content-Type':'text/html'});
        res.write(txt);
        res.end();
    });
});

app.post('/', function(req, res) {
    file = "index.html";
    fs.readFile(file, function(err, txt) {
        res.writeHead(200, {'Content-Type':'text/html'});
        res.write(txt);
        res.end();
    });
});

app.post('/reader', function(req, res) {
    file = "reader.html";
    fs.readFile(file, function(err, txt) {
        res.writeHead(200, {'Content-Type':'text/html'});
        res.write(txt);
        res.end();
    });
});

app.post('/populated', function(req, res) {
    file = "populated.html";
    fs.readFile(file, function(err, txt) {
        res.writeHead(200, {'Content-Type':'text/html'});
        res.write(txt);
        res.end();
    });
    loadDatabase();
});

app.post('/find', function(req, res) {
    var msg = "";
    var queryObj = req.body;;

    var theQuery = new Object();
    if (queryObj["querytype"] == "companyname") { //if they entered a company name
        theQuery.Company = queryObj["query"];
    }
    else if (queryObj["querytype"] == "stockticker") {  //else if they ended a stock ticker name
        theQuery.Ticker = queryObj["query"];
    }

    //do the query on mongo
    queryMongo(theQuery).then((queryResults) => {
        for (var company of queryResults) {
            msg += "<br / >Company: " + company["Company"] + ", Ticker: " + company["Ticker"] + "<br />";
        }

        //write html to to back
        msg += "<br />";
        msg += "<form id='goback' method='POST' action='/'><input type='submit' value='Go back' name='goback' id='goback'></input></form>";

        //RESPOND!
        res.send(msg);
    })


});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});

function loadDatabase() {
    var MongoClient = mongo.MongoClient;
    var url = "mongodb+srv://hw12user:hw12password@cluster0.6ibnf.mongodb.net";

    //establish database connection
    MongoClient.connect(url, function(err, db) {
        if (err) {
            return console.log(err);
        }
        var dbo = db.db("hw12database");
        var companies = dbo.collection("companies");

        //load in CSV file
        companylist = [];
        fs.createReadStream('companies-1.csv')
        .pipe(csv())
        .on('data', (row) => {
            let rowObj = JSON.parse(JSON.stringify(row));
            console.log(rowObj);
            companylist.push(rowObj);
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
            insertIntoMongo(companylist);
        });
        
        db.close();
    });
}

function insertIntoMongo(companylist) {
    var MongoClient = mongo.MongoClient;
    var url = "mongodb+srv://hw12user:hw12password@cluster0.6ibnf.mongodb.net";
    MongoClient.connect(url, function(err, db) {
        if (err) {
            return console.log(err);
        }
        var dbo = db.db("hw12database");
        var companies = dbo.collection("companies");
        try {
            companies.insertMany(companylist);
        } catch (e) {
            console.log(e);
            return;
        }
        db.close();
    });
}

async function queryMongo(query) {
    var MongoClient = mongo.MongoClient;
    var url = "mongodb+srv://hw12user:hw12password@cluster0.6ibnf.mongodb.net";
    var queryResults;

    const client = await MongoClient.connect(url).catch(err => {
        console.log(err);
    });
    try {
        companies = client.db("hw12database").collection("companies");
        queryResults = await companies.find(query).toArray();
    } catch(err) {
        console.log(err);
    } finally {
        client.close();
    }
    return queryResults;
}