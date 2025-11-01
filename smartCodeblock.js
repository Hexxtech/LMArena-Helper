// ==UserScript==
// @name         Smart Codeblock
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Adds download and preview buttons to code blocks on arena.lmsys.org with smart type detection.
// @author       Xedric Antiola
// @match        https://lmarena.ai/*
// @match        https://www.lmarena.ai/*
// @match        https://*.lmarena.ai/*
// @match        https://www.lmarena.ai/c/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48cGF0aCBkPSJNMTIgMmExNS4zIDE1LjMgMCAwIDEgNCAxMCAxNS4zIDE1LjMgMCAwIDEtNCAxMCAxNS4zIDE1LjMgMCAwIDEtNC0xMCAxNS4zIDE1LjMgMCAwIDEgNC0xMHoiLz48L3N2Zz4=
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    const extensionMap = {
        'python': 'py', 'javascript': 'js', 'html': 'html', 'css': 'css',
        'json': 'json', 'shell': 'sh', 'bash': 'sh', 'typescript': 'ts',
        'xml': 'xml', 'markdown': 'md', 'text': 'txt'
    };

    // Language options for the codeblock dialog
    const languageOptions = [
        { label: ' ', value: '' }, // Default - No Language (empty label)
        { label: 'JavaScript', value: 'javascript' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'Python', value: 'python' },
        { label: 'Java', value: 'java' },
        { label: 'C#', value: 'csharp' },
        { label: 'C++', value: 'cpp' },
        { label: 'Ruby', value: 'ruby' },
        { label: 'Go', value: 'go' },
        { label: 'Shell / Bash', value: 'bash' },
        { label: 'SQL', value: 'sql' },
        { label: 'JSON', value: 'json' },
        { label: 'YAML', value: 'yaml' },
        { label: 'XML', value: 'xml' },
        { label: 'Markdown', value: 'markdown' },
        { label: 'PHP', value: 'php' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'Plain Text', value: 'text' }
    ];

    /**
     * A helper function to inject CSS into the page without using @grant.
     * @param {string} css - The CSS rules to add.
     */
    function addGlobalStyle(css) {
        const head = document.head || document.getElementsByTagName('head')[0];
        if (!head) { return; }
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    // --- Style Injection for Dark Mode ---
    addGlobalStyle(`
        /* The .dark selector is used by the website on the <html> tag. */

        /* Light Mode: Use the default button text color */
        .code-download-button, .code-preview-button, .code-codeblock-button { color: var(--text-tertiary); }
        .code-download-button:hover, .code-preview-button:hover, .code-codeblock-button:hover { color: var(--text-secondary); }

        /* Dark Mode: Make the icon visible and match the theme */
        .dark .code-download-button, .dark .code-preview-button, .dark .code-codeblock-button { color: #a0aec0; }
        .dark .code-download-button:hover, .dark .code-preview-button:hover, .dark .code-codeblock-button:hover { color: #e2e8f0; }

        /* Codeblock Dialog Styles */
        .codeblock-dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        }

        .codeblock-dialog {
            background-color: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 24px;
            max-width: 600px;
            width: 90%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }

        .codeblock-dialog-header {
            color: #e2e8f0;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .codeblock-dialog-label {
            color: #e2e8f0;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            display: block;
        }

        .codeblock-dialog-select {
            width: 100%;
            background-color: #0a0a0a;
            border: 1px solid #404040;
            border-radius: 8px;
            padding: 10px 12px;
            color: #e2e8f0;
            font-size: 14px;
            margin-bottom: 16px;
            cursor: pointer;
        }

        .codeblock-dialog-select:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .codeblock-dialog-select option {
            background-color: #1a1a1a;
            color: #e2e8f0;
        }

        .codeblock-dialog-textarea {
            width: 100%;
            min-height: 200px;
            background-color: #0a0a0a;
            border: 1px solid #404040;
            border-radius: 8px;
            padding: 12px;
            color: #e2e8f0;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            resize: vertical;
            margin-bottom: 12px;
        }

        .codeblock-dialog-textarea:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .codeblock-dialog-counter {
            color: #a0aec0;
            font-size: 12px;
            margin-bottom: 16px;
            text-align: right;
        }

        .codeblock-dialog-counter.limit-warning {
            color: #fbbf24;
        }

        .codeblock-dialog-counter.limit-exceeded {
            color: #ef4444;
        }

        .codeblock-dialog-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        .codeblock-dialog-button {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
        }

        .codeblock-dialog-button-cancel {
            background-color: #2a2a2a;
            color: #a0aec0;
            border: 1px solid #404040;
        }

        .codeblock-dialog-button-cancel:hover {
            background-color: #333;
            color: #e2e8f0;
        }

        .codeblock-dialog-button-submit {
            background-color: #6366f1;
            color: white;
        }

        .codeblock-dialog-button-submit:hover {
            background-color: #5558e3;
        }

        .codeblock-dialog-button-submit:disabled {
            background-color: #404040;
            color: #666;
            cursor: not-allowed;
        }
    `);

    // --- Core Functions ---

    /**
     * Detects the type of code from the codeblock header
     * @param {Element} codeBlockHeader - The code block header element
     * @returns {string} The detected file type
     */
    function detectCodeType(codeBlockHeader) {
        const typeSpan = codeBlockHeader.querySelector('div > span');
        const fileType = typeSpan?.textContent.trim().toLowerCase() || 'text';
        return fileType;
    }

    function addDownloadButton(codeBlockHeader) {
        // Check if our button group is already there to prevent duplicates
        if (codeBlockHeader.querySelector('.button-group-wrapper')) return;

        const copyButton = codeBlockHeader.querySelector('[data-sentry-component="CopyButton"]');
        if (!copyButton) {
            console.warn("Smart Codeblock: Could not find copy button to attach to.");
            return;
        }

        // Detect code type
        const codeType = detectCodeType(codeBlockHeader);

        // Create a wrapper for the buttons
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'flex items-center button-group-wrapper';

        // Create the download button with simple down arrow icon
        const downloadButton = copyButton.cloneNode(true);
        downloadButton.classList.add('code-download-button');
        downloadButton.setAttribute('data-state', 'closed');
        downloadButton.removeAttribute('data-slot');
        downloadButton.title = "Download file";

        downloadButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
        `;

        downloadButton.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDownload(codeBlockHeader);
        });

        // Replace the original copy button with our wrapper
        copyButton.replaceWith(buttonWrapper);

        // Add download button first
        buttonWrapper.appendChild(downloadButton);

        // If HTML, add a Preview button BEFORE copy button
        if (codeType === 'html') {
            const previewButton = copyButton.cloneNode(true);
            previewButton.classList.add('code-preview-button');
            previewButton.setAttribute('data-state', 'closed');
            previewButton.removeAttribute('data-slot');
            previewButton.title = "Preview HTML";

            previewButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M2 12h20"></path>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            `;

            previewButton.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePreview(codeBlockHeader);
            });

            // SWITCHED: Preview comes before copy
            buttonWrapper.appendChild(previewButton);
        }

        // Copy button comes last
        buttonWrapper.appendChild(copyButton);
    }

    function handleDownload(codeBlockHeader) {
        const codeWrapper = codeBlockHeader.nextElementSibling;
        const codeElement = codeWrapper?.querySelector('code');

        if (!codeElement) {
            alert("Could not find code content to download.");
            return;
        }
        const codeContent = codeElement.textContent || '';

        const fileType = detectCodeType(codeBlockHeader);
        const extension = extensionMap[fileType] || 'txt';
        const defaultFilename = `code-${Date.now()}.${extension}`;

        const finalFilename = prompt("Enter filename for download:", defaultFilename);

        if (!finalFilename) {
            console.log("Smart Codeblock: Download cancelled by user.");
            return;
        }

        const blob = new Blob([codeContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handlePreview(codeBlockHeader) {
        const codeWrapper = codeBlockHeader.nextElementSibling;
        const codeElement = codeWrapper?.querySelector('code');

        if (!codeElement) {
            alert("Could not find HTML content to preview.");
            return;
        }
        const htmlContent = codeElement.textContent || '';

        // Open a new window
        const newWindow = window.open('', '_blank');
        
        if (!newWindow) {
            alert("Preview blocked by popup blocker. Please allow popups for this site.");
            return;
        }

        // Write the HTML content directly to the new window's document
        newWindow.document.open();
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    }

    // --- Codeblock Button Functions ---

    function createCodeblockDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'codeblock-dialog-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'codeblock-dialog';

        const header = document.createElement('div');
        header.className = 'codeblock-dialog-header';
        header.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Create Codeblock
        `;

        // Language selector
        const languageLabel = document.createElement('label');
        languageLabel.className = 'codeblock-dialog-label';
        languageLabel.textContent = 'Language';

        const languageSelect = document.createElement('select');
        languageSelect.className = 'codeblock-dialog-select';

        languageOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            languageSelect.appendChild(optionElement);
        });

        // Set default to empty (first option)
        languageSelect.value = '';

        // Code input label
        const codeLabel = document.createElement('label');
        codeLabel.className = 'codeblock-dialog-label';
        codeLabel.textContent = 'Code';

        const textarea = document.createElement('textarea');
        textarea.className = 'codeblock-dialog-textarea';
        textarea.placeholder = 'Enter your code here...';
        textarea.maxLength = 119500;

        const counter = document.createElement('div');
        counter.className = 'codeblock-dialog-counter';
        counter.textContent = '0 / 119500 characters';

        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            counter.textContent = `${length} / 119500 characters`;
            
            if (length > 110000) {
                counter.className = 'codeblock-dialog-counter limit-warning';
            } else {
                counter.className = 'codeblock-dialog-counter';
            }
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'codeblock-dialog-buttons';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'codeblock-dialog-button codeblock-dialog-button-cancel';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        const submitButton = document.createElement('button');
        submitButton.className = 'codeblock-dialog-button codeblock-dialog-button-submit';
        submitButton.textContent = 'Send as Codeblock';
        submitButton.addEventListener('click', () => {
            const content = textarea.value.trim();
            const language = languageSelect.value;
            if (content) {
                sendCodeblock(content, language);
                document.body.removeChild(overlay);
            }
        });

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(submitButton);

        dialog.appendChild(header);
        dialog.appendChild(languageLabel);
        dialog.appendChild(languageSelect);
        dialog.appendChild(codeLabel);
        dialog.appendChild(textarea);
        dialog.appendChild(counter);
        dialog.appendChild(buttonContainer);

        overlay.appendChild(dialog);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        document.body.appendChild(overlay);
        textarea.focus();
    }

    function sendCodeblock(content, language = '') {
        // Format with language info string
        const formattedContent = language 
            ? `\`\`\`${language}\n${content}\n\`\`\`` 
            : `\`\`\`\n${content}\n\`\`\``;
        
        // Find the textarea in the chat input
        const chatTextarea = document.querySelector('textarea[placeholder*="Ask"], textarea[name="prompt"]');
        
        if (!chatTextarea) {
            console.error("Smart Codeblock: Could not find chat textarea");
            alert("Could not find chat input. Please try again.");
            return;
        }

        // ✨ Use the native setter to trigger React's onChange
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 
            "value"
        ).set;
        nativeTextAreaValueSetter.call(chatTextarea, formattedContent);

        // Dispatch both input and change events
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        chatTextarea.dispatchEvent(inputEvent);

        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        chatTextarea.dispatchEvent(changeEvent);

        // Focus the textarea
        chatTextarea.focus();

        // Try to click submit button after a delay
        setTimeout(() => {
            const submitButton = document.querySelector('button[type="submit"][data-sentry-element="Button"]');
            if (submitButton && !submitButton.disabled) {
                submitButton.click();
            } else {
                console.log("Smart Codeblock: Text inserted. Submit button ready.");
            }
        }, 150);
    }

    function addCodeblockButton() {
        // Check if button already exists
        if (document.querySelector('.smart-codeblock-button')) return;

        // Find the container with the gap-2 class that has the buttons
        const container = document.querySelector('.flex.justify-between.gap-4 .flex.items-center.gap-2');
        
        if (!container) {
            console.warn("Smart Codeblock: Could not find button container");
            return;
        }

        // Create the codeblock button with side-by-side panel icon
        const codeblockButton = document.createElement('button');
        codeblockButton.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ring-offset-2 focus-visible:ring-offset-surface-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 h-8 w-8 text-interactive-active border border-border-faint bg-transparent hover:text-interactive-normal hover:bg-surface-secondary active:text-text-tertiary smart-codeblock-button';
        codeblockButton.type = 'button';
        codeblockButton.title = 'Create Codeblock';
        codeblockButton.setAttribute('data-state', 'closed');

        codeblockButton.innerHTML = `
            <svg class="size-4" height="16" stroke-linejoin="round" viewBox="0 0 17 17" width="16" style="color:currentcolor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.245 2.5H14.5V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H6.245V2.5ZM4.995 2.5H1.5V12.5C1.5 13.0523 1.94772 13.5 2.5 13.5H4.995V2.5ZM0 1H1.5H14.5H16V2.5V12.5C16 13.8807 14.8807 15 13.5 15H2.5C1.11929 15 0 13.8807 0 12.5V2.5V1Z" fill="currentColor"></path>
            </svg>
        `;

        codeblockButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            createCodeblockDialog();
        });

        // Insert before the submit button's parent container
        const submitButtonContainer = container.parentElement;
        submitButtonContainer.insertBefore(codeblockButton, container);
    }

    // --- Observer to handle dynamically added content ---

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Handle codeblock headers
                    if (node.matches('[data-sentry-element="CodeBlockGroup"]')) {
                        addDownloadButton(node);
                    }
                    const headers = node.querySelectorAll('[data-sentry-element="CodeBlockGroup"]');
                    headers.forEach(addDownloadButton);

                    // Handle chat input area
                    if (node.matches('.flex.justify-between.gap-4') || node.querySelector('.flex.justify-between.gap-4')) {
                        addCodeblockButton();
                    }
                }
            }
        }
    });

    // --- Script Initialization ---

    observer.observe(document.body, { childList: true, subtree: true });

    // Initialize existing elements
    document.querySelectorAll('[data-sentry-element="CodeBlockGroup"]').forEach(addDownloadButton);
    addCodeblockButton();

    // Re-check for button periodically in case it's added after initial load
    setInterval(addCodeblockButton, 2000);

})();