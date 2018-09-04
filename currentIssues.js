const axios = require('axios');
const async = require("async");
const fs = require('fs');

'use strict';


let rawdata = fs.readFileSync(process.argv[2]);
let issues = JSON.parse(rawdata);

const issuesArray = issues.Issues;


// Retrieve current issue information from GitHub
function getIssueInfo(issue, callback){
  let repoName = issue.Repo
  let number = issue.IssueID

  let url = `https://api.github.com/repos/${repoName}/issues/${number}?client_id=****&client_secret=****`

  axios.get(url).then(response => {
    callback(null,response);
  });
}


/**
 * Group the given issues by their labels.
 *
 *
 * @param {array} issues - The issues to group.
 */
function groupByLabel(issues) {
  let groups = {};
  groups.totalIssues = issues.length
  issues.forEach(function (issue) {
    issue.labels.forEach(function (label) {
      if (!groups.hasOwnProperty(label.name)) {
        groups[label.name] = {};
        groups[label.name].name = label.name;
        groups[label.name].count = 0
        groups[label.name].issues = [];
      }
      let name = label.name
      groups[label.name].issues.push(issue);
      groups[label.name].count += 1
    });
  });

  return groups;
}


/**
 * return statistics for collection of labels.
 *
 * @param {object} collection - The issues grouped by label.
 */

function getCollectionDetails(labelCollection) {
  let data = {};
  let issueCount = labelCollection.totalIssues
  let labelCount = 0



  data.totalIssues = issueCount;
  data.percentages = {}


  Object.keys(labelCollection).forEach(function(label) {
    labelCount += 1

    let percent = (labelCollection[label].count / issueCount) * 100

    percent = Math.round( percent * 100 ) / 100;
    label = labelCollection[label].name;
    data.percentages[label] = percent;
  });

  data.totalLabels = labelCount;

  let saveData = JSON.stringify(data);
  fs.writeFileSync(process.argv[4], saveData);

  return data
}


console.log('Loading......')
let issueDetailsArray = []


// Loops through all issues, makes API call, creates object of info, adds to array
async.each(issuesArray, function(issue, callback){
  let issueInfo = {}
  issueInfo.repo = issue.Repo;
  issueInfo.number = issue.IssueID;


  getIssueInfo(issue, function(err, data){
    if(err){
      callback(err);
      return;
    }
    if(data){
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
    let info = {}
    info.issues = issueDetailsArray;

    let grouped = groupByLabel(issueDetailsArray)


    let issueData = JSON.stringify(grouped);
    fs.writeFileSync(process.argv[3], issueData);

    console.log(getCollectionDetails(grouped))
  }
})
