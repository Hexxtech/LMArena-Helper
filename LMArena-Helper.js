// ==UserScript==
// @name       LMArena Helper
// @version      1.1
// @description  Loads the LMArena Helper scripts (smartCodeblock and smartUpload) from GitHub.
// @author       Xedric Antiola
// @match        https://lmarena.ai/*
// @match        https://www.lmarena.ai/*
// @match        https://*.lmarena.ai/*
// @match        https://www.lmarena.ai/c/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lmarena.ai
//
// @require      https://raw.githubusercontent.com/Hexxtech/LMArena-Helper/refs/heads/main/smartCodeblock.js
// @require      https://raw.githubusercontent.com/Hexxtech/LMArena-Helper/refs/heads/main/smartUpload.js
//
// ==/UserScript==

(function() {
    'use strict';

    // The @require directives above have already loaded and executed the scripts from the URLs.
    // This main script body will run AFTER both scripts have been loaded.
    // You can add your own custom logic here if needed, or leave it empty.

    console.log('LMArena Helper: smartCodeblock and smartUpload. have been loaded.');

})();