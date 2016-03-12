var express = require('express');
var d3 = require('d3');
var app = express();

var fs = require("fs");
var file = __dirname + '/public/foo.db';
var sqlite3 = require("sqlite3").verbose();

var date_start = '2016-02-26';
    date_end = '2016-02-27';
    date_minutes = 24*60; // minutes in a day

var date_selector = "strftime('%H', 300*(strftime('%s', time)/300), 'unixepoch') * 60 + strftime('%M', 300*(strftime('%s', time)/300), 'unixepoch')";


var query = "SELECT count(*) as value, " +
             date_selector + " as date, "+
             "datetime(300*(strftime('%s', time)/300), 'unixepoch') as date_temp " + 
             "FROM login_history " +
             "WHERE date_temp >= ? AND date_temp < ? AND what like ? "+
             "GROUP BY date "+
             "ORDER BY date asc;";

/* FUNCTIONS */

function range(start, count, n) {
    return Array.apply(0, Array(count)) .map(
      function (element, index) { 
        return n*index + start;  
      }
    );
  }

var TIME_DOMAIN = range(0, date_minutes/5, 5); // 0 -> 2

/* If I wrote this monstrocity at a SE job, I would most certainly be ridiculed
   and promptly fired.

   Takes a bunch of arrays of data and joins them on date
 */
function flattenContext(context, n, mapping){
  var new_context = {};
  TIME_DOMAIN.forEach(function(val){
    new_context[''+val] = Array.apply(null, Array(n)).map(Number.prototype.valueOf,0);
  });
  context.forEach(function(val){
    rows = val["rows"];  
    rows.forEach(function(row){
      (new_context[parseInt(row["date"]) + ''])[mapping[val['key']]] = row["value"];
    });
  })
  return new_context;
}


/*****************************************************************************/

app.get('/', function(request, response) {
  var context = [];
  var data = {};
  var db = new sqlite3.Database(file);
  var MAPPING = {"everyone":0};
  var N_MAPPING = 1;
  var regex_keywords = [
  {"key":"everyone","regex":"%"}
  ];
  db.serialize(function() {
    
    regex_keywords.forEach(function(v, i, a){
      db.all(query, [date_start, date_end, v["regex"]], function(err, rows) {
        context.push({"key": v["key"], "rows":rows});
        if (i == a.length-1){
          data.context = flattenContext(context, N_MAPPING, MAPPING);
          data.time_domain = TIME_DOMAIN;
          data.mapping = MAPPING;
          response.render('pages/index', data);
        }
      });
    });
  });
  db.close();
});

/*****************************************************************************/

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/languages', function(request, response) {
  var context = [];
  var data = {};
  var db = new sqlite3.Database(file);
  var MAPPING = {"sml":0, "c0":1, "c":2, "java":3, "python":4};
  var N_MAPPING = 5;
  var regex_keywords = [
  {"key":"sml","regex":"%sml%"},
  {"key":"c0","regex":"%c0%"},
  {"key":"c","regex":"%c %"}, // matches just c and not c0
  {"key":"java","regex":"%java%"},
  {"key":"python","regex":"%py%"}
  ];
  db.serialize(function() {
    
    regex_keywords.forEach(function(v, i, a){
      db.all(query, [date_start, date_end, v["regex"]], function(err, rows) {
        context.push({"key": v["key"], "rows":rows});
        if (i == a.length-1){
          data.context = flattenContext(context, N_MAPPING, MAPPING);
          data.time_domain = TIME_DOMAIN;
          data.mapping = MAPPING;
          response.render('pages/languages', data);
        }
      });
    });
  });
  db.close();
});

/******************************************************************************/

app.get('/editors', function(request, response) {
  var context = [];
  var data = {};
  var db = new sqlite3.Database(file);
  var MAPPING = {"vim":0, "emacs":1, "nano":2, "gedit":3};
  var N_MAPPING = 4;
  var regex_keywords = [
  {"key":"vim","regex":"%vim %"},
  {"key":"emacs","regex":"%emacs %"},
  {"key":"nano","regex":"%nano %"}, // matches just c and not c0
  {"key":"gedit","regex":"%gedit %"}
  ];
  db.serialize(function() {
    
    regex_keywords.forEach(function(v, i, a){
      db.all(query, [date_start, date_end, v["regex"]], function(err, rows) {
        context.push({"key": v["key"], "rows":rows});
        if (i == a.length-1){
          data.context = flattenContext(context, N_MAPPING, MAPPING);
          data.time_domain = TIME_DOMAIN;
          data.mapping = MAPPING;
          response.render('pages/editors', data);
        }
      });
    });
  });
  db.close();
});

/*****************************************************************************/

var query2 = "SELECT who, GROUP_CONCAT(DISTINCT date) as timestamps FROM"+
  "( SELECT " + "1000*300*(strftime('%s', time)/300)" + " as date," +
  " datetime(300*(strftime('%s', time)/300), 'unixepoch') as date_temp,"+
  " who FROM login_history WHERE date_temp >= ? AND date_temp < ?)"+
  " GROUP BY WHO";

function processTimestamps(timestamps){
  var data = {};

  /* this guy's api clearly doesnt follow unix time :/ */
  var OFFSET = -17600000;

  var times = [];
  var start = timestamps[0];
  var previous = timestamps[0];
  var current = timestamps[0];
  for (var i = 1; i < timestamps.length; i++){
    current = timestamps[i];
    if (current - previous > 300000){
      if (start == previous){
        times.push({"starting_time": start-OFFSET, "display": "circle"})  
      } else {
        times.push({"starting_time": start-OFFSET, "ending_time": previous-OFFSET})
      }
      start = current;
    }
    previous = current;
  }
  if (start == current){
    times.push({"starting_time": start-OFFSET, "display": "circle"})  
  } else {
    times.push({"starting_time": start-OFFSET, "ending_time": current-OFFSET})
  }

  data.times = times;
  return data;
}

app.get('/creeper', function(request, response) {
  var data = {};
  var db = new sqlite3.Database(file);
  db.serialize(function() {
    db.all(query2, [date_start, date_end], function(err, rows) {
      var context = [];
      rows.forEach(function (row, i){
        var values = (row["timestamps"].split(",")).map(function(v){return +v});
        context.push(processTimestamps(values));
      })
      data.context = context;
      response.render('pages/creeper', data);
    });
  });
  db.close();
});

/****************************************************************************/

var subq = "(SELECT what, datetime(300*(strftime('%s', time)/300), 'unixepoch') as date_temp FROM login_history WHERE date_temp >= $date0 AND date_temp < $date1)"

var query3 = "SELECT what FROM " + subq + " WHERE what like '%vim%.%'" + " UNION ALL " +
             "SELECT what FROM " + subq + " WHERE what like '%emacs%.%'" + " UNION ALL " +
             "SELECT what FROM " + subq + " WHERE what like '%nano%.%'";

function extractFilename(str){
  var last = (str.split(' ').pop()).split('/').pop()
  return last;
}

function convertFilenames(filenames){
  var foo = {};
  foo["name"] = "files";
  foo["children"] = [];
  for (var key in filenames) {
    if (filenames.hasOwnProperty(key)) {
      foo["children"].push({"name": key, "size": filenames[key]});
    }
  }
  return foo;
}

app.get('/bubble', function(request, response) {
  var query = require('url').parse(request.url,true).query;
  var date0 = date_start;
  var date1 = date_end;
  if ("ds" in query && "de" in query){
    if (!isNaN(Date.parse(query.ds)) && !isNaN(Date.parse(query.de))){

      date0 = query.ds;
      date1 = query.de;
    }
  }

  var data = {};
  var db = new sqlite3.Database(file);
  db.serialize(function() {
    db.all(query3, {$date0: date0, $date1: date1}, function(err, rows) {
      var filenames = {};
      rows.forEach(function (row, i){
        var filename = extractFilename(row["what"]);
        if (filename in filenames){
          filenames[filename] += 5; // 5 minutes
        } else {
          filenames[filename] = 5;
        }
      })

      data.context = convertFilenames(filenames);
      response.render('pages/bubble', data);
    });
  });
  db.close();
});


/*****************************************************************************/





app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

