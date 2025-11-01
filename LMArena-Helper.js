// ==UserScript==
// @name         LMArena Helper (CSP Compliant)
// @version      2.0
// @description  Fetches and injects the LMArena Helper scripts to bypass Content Security Policy (CSP) restrictions.
// @author       Xedric Antiola
// @match        https://lmarena.ai/*
// @match        https://www.lmarena.ai/*
// @match        https://*.lmarena.ai/*
// @match        https://www.lmarena.ai/c/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lmarena.ai
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    const scriptsToLoad = [
        'https://raw.githubusercontent.com/Hexxtech/LMArena-Helper/refs/heads/main/smartCodeblock.js',
        'https://raw.githubusercontent.com/Hexxtech/LMArena-Helper/refs/heads/main/smartUpload.js'
    ];

    // --- Visual Loading Indicator ---
    const indicator = document.createElement('div');
    Object.assign(indicator.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: '#ffc107',
        color: 'black',
        padding: '10px 20px',
        borderRadius: '5px',
        zIndex: '20000',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        transition: 'all 0.5s ease-in-out'
    });
    indicator.textContent = '🚀 Loading LMArena Helper...';
    // Append after a short delay to ensure body is ready
    setTimeout(() => document.body.appendChild(indicator), 100);

    /**
     * Fetches a script as text and executes it by injecting it into a <script> tag.
     * This method bypasses CSP restrictions on script src attributes.
     * @param {string} url The URL of the script to load.
     * @returns {Promise<void>} A promise that resolves when the script is fetched and injected.
     */
    function fetchAndExecute(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error fetching script: ${response.status} for ${url}`);
                }
                return response.text();
            })
            .then(scriptText => {
                const scriptElement = document.createElement('script');
                scriptElement.textContent = scriptText;
                document.head.appendChild(scriptElement);
                console.log(`LMArena Helper: Successfully fetched and executed script from ${url}`);
            });
    }

    // --- Main Execution ---
    console.log('LMArena Helper: Starting CSP-compliant loader...');

    Promise.all(scriptsToLoad.map(fetchAndExecute))
        .then(() => {
            console.log('LMArena Helper: All modules loaded successfully.');
            indicator.textContent = '✅ LMArena Helper Loaded!';
            indicator.style.backgroundColor = '#28a745';
            indicator.style.color = 'white';

            // Fade out the success indicator
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 500);
            }, 2500);
        })
        .catch(error => {
            console.error('LMArena Helper: A critical error occurred while loading modules.', error);
            indicator.textContent = '❌ Helper Failed to Load. Check Console.';
            indicator.style.backgroundColor = '#dc3545';
            indicator.style.color = 'white';
        });

})();
