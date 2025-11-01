// ==UserScript==
// @name         LMArena Code File Uploader
// @namespace    http://tampermonkey.net/
// @version      4.9
// @description   Adds upload button to lmarena chat
// @author        Xedric Antiola
// @match        https://lmarena.ai/*
// @match        https://www.lmarena.ai/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const HARDCODED_MAX_CHARS = 120000;
    const AI_RESPONSE_TIMEOUT_MS = 15000; // 15 seconds
    const SEND_ACTIVATION_TIMEOUT_MS = 5000;
    const BUTTON_CHECK_DEBOUNCE_MS = 200;

    let _cachedChatContainer = null;
    let _addButtonTimeout = null;

    const extensionToLanguage = {
        'txt': 'text', 'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript', 'html': 'html',
        'htm': 'html', 'css': 'css', 'scss': 'scss', 'sass': 'sass', 'py': 'python', 'java': 'java', 'c': 'c', 'cpp': 'cpp',
        'cs': 'csharp', 'php': 'php', 'rb': 'ruby', 'go': 'go', 'rs': 'rust', 'kt': 'kotlin', 'swift': 'swift', 'md': 'markdown',
        'json': 'json', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml', 'sql': 'sql', 'sh': 'bash', 'bash': 'bash', 'ps1': 'powershell',
        'r': 'r', 'lua': 'lua', 'vim': 'vim', 'diff': 'diff'
    };

    const acceptedFileTypes = Object.keys(extensionToLanguage).map(ext => `.${ext}`).join(',');

    const detectModelBName = () => {
        const modelButtons = document.querySelectorAll('button[role="combobox"]');
        if (modelButtons.length < 2) return 'Unknown';
        return modelButtons[1]?.querySelector('span')?.textContent.trim() || 'Unknown';
    };

    const getModelMaxChars = () => HARDCODED_MAX_CHARS;
    const findChatInput = () => document.querySelector('textarea[data-sentry-element="AutoResizeTextarea"], textarea');
    
    const findSendButton = () => {
        const selectors = [
            'button[type="submit"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="submit"]',
            'form button[type="submit"]'
        ];
        
        for (const selector of selectors) {
            const btn = document.querySelector(selector);
            if (btn) return btn;
        }
        return null;
    };

    const findChatContainer = () => {
        if (_cachedChatContainer && document.body.contains(_cachedChatContainer)) {
            console.log('LMArena Uploader: Using cached chat container');
            return _cachedChatContainer;
        }

        console.log('LMArena Uploader: Attempting to find chat container...');

        const sendButton = findSendButton();
        if (sendButton) {
            const formElement = sendButton.closest('form');
            
            if (formElement) {
                const prev = formElement.previousElementSibling;
                
                const candidates = [
                    { elem: prev?.firstChild, name: 'prev.firstChild' },
                    { elem: prev, name: 'prev (itself)' },
                    { elem: prev?.querySelector('[class*="message"]'), name: 'prev message container' },
                    { elem: prev?.querySelector('div[class*="scroll"]'), name: 'prev scroll div' },
                    { elem: prev?.querySelector('div > div'), name: 'prev > div > div' },
                    { elem: formElement.parentElement?.querySelector('[class*="message"]'), name: 'parent message container' },
                    { elem: formElement.parentElement?.firstChild, name: 'parent.firstChild' }
                ];
                
                for (const { elem, name } of candidates) {
                    if (elem && elem.children && elem.children.length > 0) {
                        console.log(`✅ Found chat container via: ${name}`);
                        _cachedChatContainer = elem;
                        return _cachedChatContainer;
                    }
                }
            }
        }

        const patterns = [
            '[class*="messages"]',
            '[class*="chat"]',
            '[class*="conversation"]',
            'div[role="log"]',
            'div[role="list"]'
        ];

        for (const pattern of patterns) {
            const containers = document.querySelectorAll(pattern);
            for (const container of containers) {
                if (container.children.length > 0) {
                    console.log(`✅ Found via pattern "${pattern}"`);
                    _cachedChatContainer = container;
                    return _cachedChatContainer;
                }
            }
        }

        const allDivs = Array.from(document.querySelectorAll('div'));
        const scrollableDivs = allDivs
            .filter(div => {
                const style = getComputedStyle(div);
                return (div.scrollHeight > div.clientHeight) || 
                       style.overflowY === 'auto' || 
                       style.overflowY === 'scroll';
            })
            .sort((a, b) => b.children.length - a.children.length);

        if (scrollableDivs.length > 0 && scrollableDivs[0].children.length > 0) {
            console.log('✅ Found via heuristic (scrollable)');
            _cachedChatContainer = scrollableDivs[0];
            return _cachedChatContainer;
        }

        console.error('LMArena Uploader: All strategies failed');
        return null;
    };

    const createPopupDialog = () => {
        const dialog = document.createElement('div');
        dialog.id = 'custom-upload-dialog';
        dialog.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 10000;">
                <div style="background-color: #1e1e2e; color: #e0e0e0; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); border: 1px solid #3a3a4a;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">Upload Codeblock</h2>
                    <div id="detected-models-info" style="font-size: 13px; color: #b0b0b0; margin-bottom: 16px; text-align: center; border: 1px solid #3a3a4a; padding: 6px; border-radius: 4px; background-color: #2a2a3a;"></div>
                    <p style="margin: 0 0 16px 0; color: #a0a0a0;">Select a code file to send to the chat</p>
                    <div style="margin-bottom: 16px;">
                        <input type="file" id="custom-file-input" accept="${acceptedFileTypes}" style="width: 100%; padding: 8px; border: 2px dashed #3a3a4a; border-radius: 4px; cursor: pointer; background-color: #2a2a3a; color: #e0e0e0;">
                    </div>
                    <div id="file-preview" style="margin-bottom: 16px; padding: 8px; background: #2a2a3a; border-radius: 4px; font-size: 14px; color: #a0a0a0; display: none; border: 1px solid #3a3a4a; min-height: 20px; word-wrap: break-word;"></div>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button id="custom-cancel-btn" style="padding: 8px 16px; border: 1px solid #3a3a4a; border-radius: 4px; background: #2a2a3a; color: #e0e0e0; cursor: pointer; font-size: 14px;">Cancel</button>
                        <button id="custom-upload-btn" style="padding: 8px 16px; border: none; border-radius: 4px; background: #4a6bdf; color: white; cursor: pointer; font-size: 14px;">Upload</button>
                    </div>
                </div>
            </div>
        `;
        return dialog;
    };

    const getFileExtension = (filename) => filename.split('.').pop().toLowerCase();

    const insertTextIntoChat = (content) => {
        const chatInput = findChatInput();
        if (!chatInput) {
            console.error('LMArena Uploader: Chat input not found');
            return false;
        }

        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(chatInput, content);
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        chatInput.focus();
        chatInput.style.height = 'auto';
        chatInput.style.height = `${chatInput.scrollHeight}px`;
        
        console.log('LMArena Uploader: Text inserted into textarea');
        return true;
    };

    // UPDATED: Close keyboard after sending
    const clickSendButton = () => {
        return new Promise((resolve, reject) => {
            const chatInput = findChatInput();
            const sendButton = findSendButton();
            if (!sendButton) return reject(new Error('Send button not found.'));

            const observer = new MutationObserver(() => {
                if (!sendButton.disabled) {
                    clearTimeout(observerTimeout);
                    observer.disconnect();
                    sendButton.click();
                    console.log('LMArena Uploader: Send button clicked');
                    
                    // Close keyboard by removing focus from textarea
                    if (chatInput) {
                        setTimeout(() => {
                            chatInput.blur();
                            console.log('LMArena Uploader: Keyboard closed');
                        }, 150);
                    }
                    
                    setTimeout(resolve, 200);
                }
            });

            const observerTimeout = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Send button did not activate within ${SEND_ACTIVATION_TIMEOUT_MS / 1000}s.`));
            }, SEND_ACTIVATION_TIMEOUT_MS);

            observer.observe(sendButton, { attributes: true, attributeFilter: ['disabled'] });

            if (!sendButton.disabled) {
                observer.disconnect();
                clearTimeout(observerTimeout);
                sendButton.click();
                console.log('LMArena Uploader: Send button clicked (already enabled)');
                
                // Close keyboard by removing focus from textarea
                if (chatInput) {
                    setTimeout(() => {
                        chatInput.blur();
                        console.log('LMArena Uploader: Keyboard closed');
                    }, 150);
                }
                
                setTimeout(resolve, 200);
            }
        });
    };

    const showStatusMessage = (message, isCountdown = false) => {
        removeStatusMessage();
        const statusDiv = document.createElement('div');
        statusDiv.id = 'upload-status-message';
        statusDiv.textContent = message;
        if (isCountdown) {
            statusDiv.setAttribute('data-countdown', 'true');
        }
        Object.assign(statusDiv.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(30, 30, 46, 0.9)',
            color: '#e0e0e0',
            padding: '10px 20px',
            borderRadius: '8px',
            zIndex: '10001',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            border: '1px solid #3a3a4a',
            minWidth: '300px',
            textAlign: 'center'
        });
        document.body.appendChild(statusDiv);
    };

    const updateStatusMessage = (message) => {
        const statusDiv = document.getElementById('upload-status-message');
        if (statusDiv) {
            statusDiv.textContent = message;
        }
    };

    const removeStatusMessage = () => {
        const statusDiv = document.getElementById('upload-status-message');
        if (statusDiv) statusDiv.remove();
    };

    const waitForAiResponse = (chatContainer, nextPartNumber, totalParts) => {
        return new Promise((resolve) => {
            console.log('LMArena Uploader: Starting AI response wait (15s max)...');
            
            const initialMessageCount = chatContainer.children.length;
            const initialTextLength = chatContainer.textContent.length;
            
            console.log(`Initial state - Children: ${initialMessageCount}, TextLength: ${initialTextLength}`);

            let lastChangeTime = Date.now();
            let hasDetectedChange = false;
            let stableCheckInterval = null;
            let countdownInterval = null;
            let secondsRemaining = 15;

            const sendButton = findSendButton();

            const updateCountdown = () => {
                secondsRemaining--;
                if (secondsRemaining >= 0) {
                    const message = nextPartNumber 
                        ? `⏳ Waiting for AI response (${secondsRemaining}s) - Part ${nextPartNumber}/${totalParts} ready to send...`
                        : `⏳ Waiting for AI response (${secondsRemaining}s)...`;
                    updateStatusMessage(message);
                }
            };

            const initialMessage = nextPartNumber 
                ? `⏳ Waiting for AI response (${secondsRemaining}s) - Part ${nextPartNumber}/${totalParts} ready to send...`
                : `⏳ Waiting for AI response (${secondsRemaining}s)...`;
            showStatusMessage(initialMessage, true);
            countdownInterval = setInterval(updateCountdown, 1000);
            
            const checkIfResponseComplete = () => {
                const currentMessageCount = chatContainer.children.length;
                const currentTextLength = chatContainer.textContent.length;
                const sendButtonEnabled = sendButton && !sendButton.disabled;

                const contentChanged = currentMessageCount > initialMessageCount || 
                                      currentTextLength > initialTextLength;

                if (contentChanged && !hasDetectedChange) {
                    console.log('LMArena Uploader: Content change detected!');
                    hasDetectedChange = true;
                    lastChangeTime = Date.now();
                }

                if (hasDetectedChange && sendButtonEnabled) {
                    console.log('LMArena Uploader: ✅ AI response complete (send button enabled)');
                    cleanup();
                    resolve();
                    return true;
                }

                if (hasDetectedChange && (Date.now() - lastChangeTime) > 2000) {
                    console.log('LMArena Uploader: ✅ AI response complete (content stable for 2s)');
                    cleanup();
                    resolve();
                    return true;
                }

                return false;
            };

            stableCheckInterval = setInterval(checkIfResponseComplete, 500);

            const observer = new MutationObserver((mutations) => {
                const currentMessageCount = chatContainer.children.length;
                const currentTextLength = chatContainer.textContent.length;

                if (currentMessageCount > initialMessageCount || currentTextLength > initialTextLength) {
                    if (!hasDetectedChange) {
                        console.log('LMArena Uploader: MutationObserver detected change');
                        hasDetectedChange = true;
                    }
                    lastChangeTime = Date.now();
                    checkIfResponseComplete();
                }
            });

            observer.observe(chatContainer, { 
                childList: true, 
                subtree: true, 
                characterData: true,
                attributes: true
            });

            let sendButtonObserver = null;
            if (sendButton) {
                sendButtonObserver = new MutationObserver(() => {
                    if (!sendButton.disabled && hasDetectedChange) {
                        console.log('LMArena Uploader: Send button re-enabled');
                        checkIfResponseComplete();
                    }
                });
                sendButtonObserver.observe(sendButton, { 
                    attributes: true, 
                    attributeFilter: ['disabled', 'aria-disabled']
                });
            }

            const cleanup = () => {
                clearTimeout(timeout);
                clearInterval(stableCheckInterval);
                clearInterval(countdownInterval);
                observer.disconnect();
                if (sendButtonObserver) sendButtonObserver.disconnect();
            };

            const timeout = setTimeout(() => {
                cleanup();
                if (hasDetectedChange) {
                    console.log('LMArena Uploader: ⏱️ 15s timeout - content changed, proceeding...');
                } else {
                    console.log('LMArena Uploader: ⏱️ 15s timeout - no change detected, proceeding anyway...');
                }
                resolve();
            }, AI_RESPONSE_TIMEOUT_MS);

            console.log(`LMArena Uploader: Observers active, max wait ${AI_RESPONSE_TIMEOUT_MS / 1000}s`);
        });
    };

    const splitContentIntoMessages = (fileContent, language, maxChars) => {
        const messages = [];
        const overhead = `File Part 99/99:\n\n\`\`\`${language}\n\n\`\`\``.length;
        const availableCharsPerChunk = maxChars - overhead;
        if (availableCharsPerChunk <= 0) {
            alert("The max length is too small to send even a small chunk.");
            return [];
        }
        const totalChunks = Math.ceil(fileContent.length / availableCharsPerChunk);
        let contentRemaining = fileContent;
        for (let i = 1; i <= totalChunks; i++) {
            const chunk = contentRemaining.substring(0, availableCharsPerChunk);
            contentRemaining = contentRemaining.substring(availableCharsPerChunk);
            const header = `File Part ${i}/${totalChunks}:\n\n`;
            const codeBlock = `\`\`\`${language}\n${chunk}\n\`\`\``;
            messages.push(header + codeBlock);
        }
        return messages;
    };

    const showCustomDialog = () => {
        _cachedChatContainer = null;
        
        const chatContainer = findChatContainer();
        if (!chatContainer) {
            alert(
                "❌ LMArena Uploader Error\n\n" +
                "Could not find the chat interface.\n\n" +
                "Please try:\n" +
                "1. Refreshing the page\n" +
                "2. Starting a new chat\n" +
                "3. Checking console (F12) for errors"
            );
            return;
        }

        console.log('✅ Successfully found chat container');

        if (document.getElementById('custom-upload-dialog')) return;

        const dialog = createPopupDialog();
        document.body.appendChild(dialog);

        const modelMaxChars = getModelMaxChars();
        const modelsInfoEl = document.getElementById('detected-models-info');
        modelsInfoEl.innerHTML = `Universal Max Length: <strong style="color: #e0e0e0;">${modelMaxChars.toLocaleString()} chars</strong> per message`;

        const fileInput = document.getElementById('custom-file-input');
        const filePreview = document.getElementById('file-preview');
        const closeDialog = () => dialog.remove();

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            filePreview.style.display = file ? 'block' : 'none';
            if (file) {
                filePreview.textContent = `Reading: ${file.name}...`;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const charCount = event.target.result.length;
                    const chunks = Math.ceil(charCount / (modelMaxChars - 300));
                    let sizeInfo = (charCount > modelMaxChars)
                        ? `(${charCount.toLocaleString()} chars, <strong style="color: #ffcc00;">will be split into ${chunks} messages</strong>)`
                        : `(${charCount.toLocaleString()} chars, <span style="color: #00ff99;">fits in 1 message</span>)`;
                    filePreview.innerHTML = `Selected: ${file.name} | ${sizeInfo}`;
                };
                reader.onerror = () => filePreview.textContent = `Error reading file: ${file.name}`;
                reader.readAsText(file);
            }
        });

        document.getElementById('custom-cancel-btn').addEventListener('click', closeDialog);
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog.firstElementChild) closeDialog();
        });

        document.getElementById('custom-upload-btn').addEventListener('click', async () => {
            const file = fileInput.files[0];
            if (!file) return alert('Please select a file first.');

            const uploadBtn = document.getElementById('custom-upload-btn');
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';

            try {
                const fileContent = await file.text();
                const extension = getFileExtension(file.name);
                const language = extensionToLanguage[extension] || extension || 'text';
                const modelBName = detectModelBName();
                const currentModelMaxChars = getModelMaxChars();
                let messages = [];

                if (fileContent.length <= currentModelMaxChars) {
                    const header = `File \`${file.name}\` for Model B **${modelBName}**:\n\n`;
                    const codeBlock = `\`\`\`${language}\n${fileContent}\n\`\`\``;
                    messages.push(header + codeBlock);
                } else {
                    messages = splitContentIntoMessages(fileContent, language, currentModelMaxChars);
                }

                if (messages.length === 0) throw new Error("Failed to create message chunks.");

                // Append completion message to last part if multiple parts
                if (messages.length > 1) {
                    const outroMessage = `\n\nThat was the final part. Please combine all parts and confirm you have received the complete file.`;
                    messages[messages.length - 1] += outroMessage;
                }

                closeDialog();

                // Send intro message if multiple parts
                if (messages.length > 1) {
                    const introMessage = `I'm about to upload a file in ${messages.length} parts (${file.name}). Please wait for the final part before you respond.`;
                    showStatusMessage('📢 Sending upload notification...');
                    insertTextIntoChat(introMessage);
                    await clickSendButton();
                    removeStatusMessage();
                    
                    await waitForAiResponse(chatContainer, null, null);
                    removeStatusMessage();
                }

                // Send all parts (with completion message already appended to last part)
                for (let i = 0; i < messages.length; i++) {
                    showStatusMessage(`📤 Sending part ${i + 1} of ${messages.length}...`);
                    insertTextIntoChat(messages[i]);
                    await clickSendButton();
                    removeStatusMessage();

                    if (i < messages.length - 1) {
                        insertTextIntoChat(messages[i + 1]);
                        console.log(`LMArena Uploader: Pre-loaded part ${i + 2}/${messages.length} into textarea`);
                        await waitForAiResponse(chatContainer, i + 2, messages.length);
                        removeStatusMessage();
                    }
                }
                
                console.log('LMArena Uploader: ✅ All parts sent successfully!');
                showStatusMessage('✅ Upload complete!');
                setTimeout(removeStatusMessage, 3000);

            } catch (error) {
                console.error('LMArena Uploader: Error during upload process:', error);
                alert(`Error during upload: ${error.message}`);
                removeStatusMessage();
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload';
            }
        });
    };

    const addPaperclipButton = () => {
        const buttonContainers = document.querySelectorAll('.flex.h-8.flex-none.gap-2');
        buttonContainers.forEach(container => {
            if (container.querySelector('[data-code-uploader="true"]')) return;
            const paperclipButton = document.createElement('button');
            paperclipButton.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ring-offset-2 focus-visible:ring-offset-surface-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 h-8 w-8 text-interactive-active border border-border-faint bg-transparent hover:text-interactive-normal hover:bg-surface-secondary active:text-text-tertiary';
            paperclipButton.type = 'button';
            paperclipButton.setAttribute('aria-label', 'Upload Codeblock');
            paperclipButton.setAttribute('data-code-uploader', 'true');
            paperclipButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip size-4"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`;
            paperclipButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showCustomDialog();
            });
            container.insertBefore(paperclipButton, container.children[1] || null);
        });
    };

    const observer = new MutationObserver(() => {
        clearTimeout(_addButtonTimeout);
        _addButtonTimeout = setTimeout(addPaperclipButton, BUTTON_CHECK_DEBOUNCE_MS);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    addPaperclipButton();
})();