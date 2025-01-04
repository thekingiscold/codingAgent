const vscode = require('vscode');

// Function for the "Describe Selected Code" command
async function commandCodeReview() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText.trim() === "") {
            vscode.window.showErrorMessage("No code selected. Please highlight some code and try again.");
            return;
        }

        try {
            // const description = await sendToOllamaForDescription(selectedText);
            // displayDescription(description);
            executeCommandWithProgress(selectedText,"reviewCode")
        } catch (error) {
            vscode.window.showErrorMessage(`Error describing code: ${error.message}`);
        }
    } else {
        vscode.window.showErrorMessage("No active editor found. Open a file and select some code.");
    }
}

module.exports = { commandCodeReview };