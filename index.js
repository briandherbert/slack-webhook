// Expected env settings
var slack_token = process.env.SLACK_TOKEN;

var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded());

app.post('/', function(req, res) {
    console.log('Received POST', req.headers, req.body);

    if (req.body.token != slack_token) {
        console.log("Invalid Slack token");
        return res.status(401).send('Invalid token');
    }

    var textWithoutTriggerWord = req.body.text.replace(new RegExp("^giff"), '').trim();

    console.log("text without trigger " + textWithoutTriggerWord);

    if (textWithoutTriggerWord.length > 0) {
        build_command(textWithoutTriggerWord, req, res);
    } else {
        usage_help(res, req.body.text);
    }
});

app.listen(process.env.PORT || 3000, function() {
    console.log('Express listening on port', this.address().port);
});


function usage_help(res, fullquery) {
    res.send(JSON.stringify({
        text: "Type a phrase after 'giff':\n" +
            "```\n" +
            "giff facepalm\n" + "you searched " + fullquery +
            "```"
            // Add your own command help here
    }));
}

function build_command(text, req, res) {

    console.log("Find gif " + text);

    getGif(res, text, "puns", function(imgUrl) {
        console.log("Got url " + imgUrl);
        return res.send(JSON.stringify({ text: ":package: Here you go: " + imgUrl }));
    });
}

function getGif(response, query, channel, callback) {
  console.log("get gif " + query + " for channel " + channel);

    var options = {
        host: 'www.bing.com',
        port: 80,
        path: '/images/search?q=' + query + '+filterui:photo-animatedgif'
    };


    var req = http.request(options, function(res) {
        var body = "unset";

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            body += chunk;
            //console.log("chunk " + chunk);
        });

        res.on('end', function() {
            //console.log('body: ' + body);

            var idx = body.indexOf(bingKeyword);

            if (idx > 0 && idx < body.length - 20) {
              idx += bingKeyword.length;
              var idxEnd = body.indexOf('"', idx + 1);

              if (idxEnd > 0 && idxEnd < body.length) {
                var imgUrl = body.substring(idx, idxEnd);
                console.log("found url " + imgUrl);
                //post("puns", imgUrl);
                callback(imgUrl);
              }
            }
        });

        req.on('error', function(e) {
            console.log("error" + e.message);
        });
    });

    req.end();
}


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
