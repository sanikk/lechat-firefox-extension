/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import sidebar_module from './sidebar.js';
import mistral_handler from './mistral_handler.js';

(async function() {

    'use strict';

    document.body.appendChild(sidebar_module.getSidebar());

    const dom_observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                mistral_handler.handle_mutation(node);
            }
        }
    });
    dom_observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // let's handle the DOM on extension reload:
    mistral_handler.handle_mutation(document.body);

    if ('navigation' in window) {
        window.navigation.addEventListener("navigate", (/*event*/) => {
            mistral_handler.reset_page();
            sidebar_module.resetPage();
        });
    };


})();
