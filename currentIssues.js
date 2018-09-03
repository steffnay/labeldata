const axios = require('axios');
const async = require("async");
const fs = require('fs');

'use strict';


let rawdata = fs.readFileSync(process.argv[2]);
let issues = JSON.parse(rawdata);

const issuesArray = issues.Issues;


// Retrieves current issue information from GitHub
function getIssueInfo(issue, callback){
  let repoName = issue.Repo
  let number = issue.IssueID

  let url = `https://api.github.com/repos/${repoName}/issues/${number}?client_id=****&client_secret=****`

  axios.get(url).then(response => {
    callback(null,response);
  });
}

let issueDetailsArray = []


// Loops through all issues, makes API call, creates object of info, adds to array
async.each(issuesArray, function(issue, callback){
  let issueInfo = {}
  issueInfo.repo = issue.Repo
  issueInfo.number = issue.IssueID


  getIssueInfo(issue, function(err, data){
    if(err){
      callback(err);
      return;
    }
    if(data){
      // console.log(data.data)
      issueInfo.title = data.data.title;
      issueInfo.body = data.data.body;
      issueInfo.labels = data.data.labels;
      issueDetailsArray.push(issueInfo);
      callback();
    }
  });
}, function(err){
  if(err){
    console.log('API call failed');
  }else{
    console.log('Issue Details Array', issueDetailsArray)
  }
})
