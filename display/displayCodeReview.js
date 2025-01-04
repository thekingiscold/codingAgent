const vscode = require('vscode');

function displayCodeReview(codeReviewText) {
    vscode.window.showInformationMessage(`Code Review:\n${codeReviewText}`);
}

module.exports = { displayCodeReview };