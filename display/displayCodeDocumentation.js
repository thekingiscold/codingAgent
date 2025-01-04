const vscode = require('vscode');
const { marked } = require('marked');

function displayCodeDocumentaion(generatedDoc) {
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

module.exports = { displayCodeDocumentaion };