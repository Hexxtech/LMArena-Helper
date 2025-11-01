#LMArena Helper - Project Documentation

##Project Overview
LMArena Helper is a browser UserScript designed to significantly enhance the user experience on the lmarena.ai website. It acts as a powerful productivity tool by augmenting the chat interface with features that are essential for developers and users who frequently work with code.

The project is composed of a main loader script and two modular feature scripts:

smartCodeblock.js: Focuses on improving interactions with code blocks that are already in the chat.

smartUpload.js: Adds the ability to upload local code files into the chat, with intelligent handling for large files.
Together, these components streamline the process of sharing, saving, and managing code within the LMArena environment.

##Core Features
One-Click Code Downloads: Adds a "Download" button to every code block, allowing you to save the code directly to a file with a sensible default name and file extension.

Live HTML Previews: Adds a "Preview" button to HTML code blocks, which instantly renders the code in a new browser tab.

Codeblock Creation UI: Adds a "Create Codeblock" button to the chat input, opening a dedicated dialog for writing or pasting code, selecting its language, and sending it perfectly formatted.

File Uploads: Adds a "Paperclip" (upload) button to the chat input, allowing you to select a local file.

Intelligent File Chunking: Automatically splits large files that exceed the chat's character limit into multiple, numbered messages.

Conversational Upload Flow: When uploading a large file, the script waits for the AI to acknowledge each part before sending the next, preventing rate-limiting and ensuring the AI can process the entire file contextually.

Dynamic UI Injection: Uses modern browser APIs to reliably inject its features into the LMArena interface, even as new chat messages are added dynamically.


##Installation
To use this script, you need a UserScript manager browser extension.

Install a UserScript manager, such as Tampermonkey (recommended) or Greasemonkey.
Create a new script in the manager's dashboard.
Copy the contents of LMArena-Helper.js into the editor.
Save the script. It will automatically be active when you visit any lmarena.ai page.
