const vscode = require('vscode');
const axios = require('axios');

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.addComment', async function () {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            // Get the selected text
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);

            if (selectedText.trim() === "") {
                vscode.window.showErrorMessage("No code selected. Please highlight some code and try again.");
                return;
            }

            // Send to Ollama for analysis
            try {
                const response = await sendToOllama(selectedText);
				// console.log("Response: ",response)
                // displayResponse(response);
                appendComment(response.data.response, editor, selection);
                vscode.window.showInformationMessage("Comment added successfully!");
            } catch (error) {
                vscode.window.showErrorMessage(`Error analyzing code: ${error.message}`);
            }
        } else {
            vscode.window.showErrorMessage("No active editor found. Open a file and select some code.");
        }
    });

    context.subscriptions.push(disposable);
}

function appendComment(commentText, editor, selection) {
    console.log("Comment: ", commentText);
    commentText = commentText.replace(/^\/\/\s*/, "");
    // Format the comment with proper styling
    const formattedComment = `// ${commentText.trim()}\n`;

    // Get the text of the current line to preserve existing whitespace
    const currentLine = editor.document.lineAt(selection.start.line);
    const leadingWhitespace = currentLine.text.match(/^\s*/)?.[0] || "";

    // Insert the comment and retain the original whitespace
    editor.edit(editBuilder => {
        editBuilder.insert(selection.start, formattedComment + leadingWhitespace);
    });
}

// Function to send the code to Ollama
async function sendToOllama(selectedText) {
    const endpoint = "http://localhost:11434/api/generate"; // Ollama Llama endpoint
    const prompt = `Generate a one line concise comment that explains the purpose of the following code snippet:\n\n${selectedText}\n\nMake it professional and easy to understand. Just respond with the one line comment and nothing else. Do not append // or anything. Just the one line comment.`

    try {
        const response = await axios.post(endpoint, {
            prompt: prompt,
			model: "llama3.1",
			"stream": false
        });
		console.log('Ollama Response:', response.data.response);
        return response
    } catch (error) {
        console.error('Error communicating with Ollama:', error);
        throw error;
    }
}

// Function to display the response
function displayResponse(response) {
    vscode.window.showInformationMessage(`AI Response: ${response.data.response}`);
}

exports.activate = activate;

function deactivate() {}

module.exports = {
    activate,
    deactivate
};