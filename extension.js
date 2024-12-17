const vscode = require('vscode');
const axios = require('axios');
const { marked } = require('marked');

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

    let describeCodeCommand = vscode.commands.registerCommand('extension.describeCode', describeSelectedCode);

    let debuggingCodeCommand = vscode.commands.registerCommand('extension.debugCode', debuggingHints);

    let generateDocumentCommand = vscode.commands.registerCommand('extension.generateDocument', generateDocument);

    context.subscriptions.push(disposable, describeCodeCommand, debuggingCodeCommand, generateDocumentCommand);
}

// Command implementation with progress indicator
async function executeCommandWithProgress(selectedText) {
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Coding Agent',
            cancellable: false // Set to true if you want the user to be able to cancel the task
        },
        async (progress) => {
            progress.report({ increment: 0, message: 'Please wait. Great things take time!' });

            try {
                const response = await sendToOllamaForDebugging(selectedText);
                progress.report({ increment: 100, message: 'Analysis complete!' });
                displayDebuggingHints(response);
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
        }
    );
}

// Function for the "Describe Selected Code" command
async function describeSelectedCode() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText.trim() === "") {
            vscode.window.showErrorMessage("No code selected. Please highlight some code and try again.");
            return;
        }

        try {
            const description = await sendToOllamaForDescription(selectedText);
            displayDescription(description);
        } catch (error) {
            vscode.window.showErrorMessage(`Error describing code: ${error.message}`);
        }
    } else {
        vscode.window.showErrorMessage("No active editor found. Open a file and select some code.");
    }
}

// Function for the "Help Me Debug" command
async function debuggingHints() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText.trim() === "") {
            vscode.window.showErrorMessage("No code selected. Please highlight some code and try again.");
            return;
        }

        try {
            // const debuggingHintsResponse = await sendToOllamaForDebugging(selectedText);
            // displayDebuggingHints(debuggingHintsResponse);
            executeCommandWithProgress(selectedText)
        } catch (error) {
            vscode.window.showErrorMessage(`Error debugging code: ${error.message}, Full error: ${error}`);
        }
    } else {
        vscode.window.showErrorMessage("No active editor found. Open a file and select some code.");
    }
}

async function generateDocument() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText.trim() === "") {
            vscode.window.showErrorMessage("No code selected. Please highlight some code and try again.");
            return;
        }

        try {
            const generatedDoc = await ollamaGenerateDocument(selectedText);
            displayGeneratedDoc(generatedDoc);
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating document: ${error.message}, Full error: ${error}`);
        }
    } else {
        vscode.window.showErrorMessage("No active editor found. Open a file and select some code.");
    }
}

async function sendToOllamaForDebugging(code) {
    const apiUrl = "http://localhost:11434/api/generate"; // Replace with your Ollama API endpoint
    // const prompt = `Analyze the following code snippet and identify potential reasons why it might fail:\n\n${code}\n\nRespond with debugging tips only, formatted as a clear, line-separated list. Limit your response to 200 words.`;
    const prompt = `
                    Answer within 200 provide debugging tips:\n\n${code}]\n
                    Only respond with debugging tips in a list. Stricty use Markdown to format your response. Use backticks for code.
                    Don't append any header or footer. We need just the list in proper markdown format.
                    `;
    const body = {
        model: "llama3.1",
        prompt: prompt,
        stream: false
    };

    try {
        const response = await axios.post(apiUrl, body);
        return response.data.response;
    } catch (error) {
        throw new Error("Failed to fetch description from Ollama.");
    }
}

async function ollamaGenerateDocument(code) {
    const apiUrl = "http://localhost:11434/api/generate"; // Replace with your Ollama API endpoint
    // const prompt = `Analyze the following code snippet and identify potential reasons why it might fail:\n\n${code}\n\nRespond with debugging tips only, formatted as a clear, line-separated list. Limit your response to 200 words.`;
    const prompt = `
                    Document this piece of code within 400 words:\n\n${code}]\n
                    Stricty use Markdown to format your response. Use backticks for code.
                    `;
    const body = {
        model: "llama3.1",
        prompt: prompt,
        stream: false
    };

    try {
        const response = await axios.post(apiUrl, body);
        return response.data.response;
    } catch (error) {
        throw new Error("Failed to fetch description from Ollama.");
    }
}


// Helper function to send code to Ollama for description
async function sendToOllamaForDescription(code) {
    const apiUrl = "http://localhost:11434/api/generate"; // Replace with your Ollama API endpoint
    const prompt = `Describe the following code within 50 words:\n\n${code}. Do not assume full forms for abbreviates. Keep abbreviates as it is and return just the description, nothing else!`;
    const body = {
        model: "llama3.1",
        prompt: prompt,
        stream: false
    };

    try {
        const response = await axios.post(apiUrl, body);
        return response.data.response;
    } catch (error) {
        throw new Error("Failed to fetch description from Ollama.");
    }
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

// Function to display description
function displayDescription(descriptionText) {
    vscode.window.showInformationMessage(`Code Description:\n${descriptionText}`);
}

// Function to display debugging hints
function displayDebuggingHints(debuggingHintsResponse) {
    // Create a Webview panel to display debugging hints
    const panel = vscode.window.createWebviewPanel(
        'debuggingHints', // Unique identifier for the webview panel
        'Debugging Tips', // Title of the panel
        vscode.ViewColumn.One, // Panel placement
        {
            enableScripts: false, // No JavaScript execution
            retainContextWhenHidden: true // Retain context when the panel is hidden
        }
    );

    // Set HTML content with black background and white text
    panel.webview.html = `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background-color: #000000;
                    color: #ffffff;
                    margin: 0;
                }
                pre {
                    background-color: #333333;
                    color: #ffffff;
                    padding: 10px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                h2 {
                    color: #007acc;
                }
                .markdown {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-size: 14px;
                }
                strong {
                    font-weight: bold;
                }
                em {
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <h2>Debugging Tips</h2>
            <div class="markdown">
                ${marked(debuggingHintsResponse)} <!-- Use the marked library to convert markdown -->
            </div>
        </body>
        </html>
    `;
}

function displayGeneratedDoc(generatedDoc) {
    // Create a Webview panel to display debugging hints
    const panel = vscode.window.createWebviewPanel(
        'documentGenerator', // Unique identifier for the webview panel
        'Code Document', // Title of the panel
        vscode.ViewColumn.One, // Panel placement
        {
            enableScripts: false, // No JavaScript execution
            retainContextWhenHidden: true // Retain context when the panel is hidden
        }
    );

    // Set HTML content with black background and white text
    panel.webview.html = `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background-color: #000000;
                    color: #ffffff;
                    margin: 0;
                }
                pre {
                    background-color: #333333;
                    color: #ffffff;
                    padding: 10px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                h2 {
                    color: #007acc;
                }
                .markdown {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-size: 14px;
                }
                strong {
                    font-weight: bold;
                }
                em {
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <h2>Generated Document</h2>
            <div class="markdown">
                ${marked(generatedDoc)} <!-- Use the marked library to convert markdown -->
            </div>
        </body>
        </html>
    `;
}

// Function to send the code to Ollama
async function sendToOllama(selectedText) {
    const endpoint = "http://localhost:11434/api/generate"; // Ollama Llama endpoint
    const prompt = `Generate a one line concise comment that explains the purpose of the following code snippet:\n\n${selectedText}\n\nMake it professional and easy to understand. Just respond with the one line comment and nothing else. Do not append // or anything. Just the one line comment.`

    try {
        const response = await axios.post(endpoint, {
            prompt: prompt,
			model: "llama3.1",
			stream: false,
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