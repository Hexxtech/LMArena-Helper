# LMArena Helper - Project Documentation

## Project Overview
LMArena Helper is a browser UserScript designed to significantly enhance the user experience on the lmarena.ai website. It acts as a powerful productivity tool by augmenting the chat interface with features that are essential for developers and users who frequently work with code.

The project is composed of a main loader script and two modular feature scripts:

smartCodeblock.js: Focuses on improving interactions with code blocks that are already in the chat.

smartUpload.js: Adds the ability to upload local code files into the chat, with intelligent handling for large files.
Together, these components streamline the process of sharing, saving, and managing code within the LMArena environment.

## Core Features
One-Click Code Downloads: Adds a "Download" button to every code block, allowing you to save the code directly to a file with a sensible default name and file extension.

Live HTML Previews: Adds a "Preview" button to HTML code blocks, which instantly renders the code in a new browser tab.

Codeblock Creation UI: Adds a "Create Codeblock" button to the chat input, opening a dedicated dialog for writing or pasting code, selecting its language, and sending it perfectly formatted.

File Uploads: Adds a "Paperclip" (upload) button to the chat input, allowing you to select a local file.

Intelligent File Chunking: Automatically splits large files that exceed the chat's character limit into multiple, numbered messages.

Conversational Upload Flow: When uploading a large file, the script waits for the AI to acknowledge each part before sending the next, preventing rate-limiting and ensuring the AI can process the entire file contextually.

Dynamic UI Injection: Uses modern browser APIs to reliably inject its features into the LMArena interface, even as new chat messages are added dynamically.

-----------------------------------------

## Quick Setup
## 🚀 Install LMArena Helper Bookmarklet

There are two easy ways to install the bookmarklet. The drag-and-drop method is the fastest.

### Method 1: Drag-and-Drop (Recommended)

1.  Make sure your browser's bookmarks bar is visible (Press `Ctrl+Shift+B` or `Cmd+Shift+B`).
2.  Click and drag the link below directly onto your bookmarks bar.

> **➡️ [LMArena Helper](javascript:(function(){"use strict";if(window.lmArenaHelperLoaded)return%20void%20alert("LMArena%20Helper%20is%20already%20active!");fetch("https://hexxtech.github.io/lmarena-helper/lmarena-helper.js").then((e=>{if(!e.ok)throw%20new%20Error(`Network%20response%20was%20not%20ok:%20${e.statusText}`);return%20e.text()})).then((e=>{const%20t=document.createElement("script");t.textContent=e,document.head.appendChild(t)})).catch((e=>{console.error("LMArena%20Helper%20Bookmarklet%20Error:",e),alert("Could%20not%20load%20the%20LMArena%20Helper%20script.%20Please%20check%20the%20browser%20console%20(F12)%20for%20more%20details.")}))})();)**

*(An animation or screenshot showing the drag-and-drop action is highly effective here)*



### Method 2: Manual Copy & Paste

If you have trouble dragging the link, you can add it manually:

1.  Right-click your bookmarks bar and select "Add Page...".
2.  **Name:** `LMArena Helper`
3.  **URL:** Copy and paste the entire code block below.

    ```javascript
    javascript:(function(){"use strict";if(window.lmArenaHelperLoaded)return void alert("LMArena Helper is already active!");fetch("https://hexxtech.github.io/lmarena-helper/lmarena-helper.js").then((e=>{if(!e.ok)throw new Error(`Network response was not ok: ${e.statusText}`);return e.text()})).then((e=>{const t=document.createElement("script");t.textContent=e,document.head.appendChild(t)})).catch((e=>{console.error("LMArena Helper Bookmarklet Error:",e),alert("Could not load the LMArena Helper script. Please check the browser console (F12) for more details.")}))})();
    ```
4.  Save the bookmark.

---
### To use the bookmarklet:
Navigate to `lmarena.ai` and click the **LMArena Helper** bookmark on your bookmarks bar. The helper scripts will then be loaded onto the page.

-----------------------------------------

##Full Installation
To use this script, you need a UserScript manager browser extension.

Install a UserScript manager, such as Tampermonkey (recommended) or Greasemonkey.
Create a new script in the manager's dashboard.
Copy the contents of LMArena-Helper.js into the editor.
Save the script. It will automatically be active when you visit any lmarena.ai page.
