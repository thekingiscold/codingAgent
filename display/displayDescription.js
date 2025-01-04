const vscode = require('vscode');

// Function to display description
function displayDescription(descriptionText) {
    vscode.window.showInformationMessage(`Code Description:\n${descriptionText}`);
}

module.exports = { displayDescription };