'use strict';
const express = require('express');
const URL = require('url');

var router = express.Router();

module.exports = function (db, config){
  const bing = require('node-bing-api')({accKey: config.bingApiKey});
 
  router.get('/api/imagesearch/:term*', function(req, res){
    let term = req.params.term;
    let offset = 0;
    if (req.query.offset){
      offset = req.query.offset;
    }
    saveTerm(term, db);
    bing.images(term, {
        count: 10,   // Number of results (max 50) 
        offset: offset    // Skip first 3 result 
      }, function(err, bingres, body){
        if (err) throw err;
        res.send(body.value.map((item) => {
          let url = URL.parse(item.contentUrl, true).query.r;
          let context = URL.parse(item.hostPageUrl, true).query.r;
          return {url: url, snippet: item.name, thumbnail: item.thumbnailUrl, context: context}
        }));
    });
  });
  
  router.get('/api/latest/imagesearch', function(req, res){
    let terms = db.collection('terms');
    terms.find().sort({when: -1}).toArray(function(err, data){
      if(err) throw err;
      res.send(data.map((unit)=>{return{term: unit.term, when: unit.when}}));
    });
  })
  
  return router;

}

function saveTerm(term, db){
  let terms = db.collection('terms');
  terms.insertOne({term: term, when: Date.now()});
}
