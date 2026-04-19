/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import sidebar_module from './sidebar.js';
import { MistralHandler, ChatGPTHandler } from './llm_handlers.js';

(async function() {

    'use strict';

    document.body.appendChild(sidebar_module.getSidebar());
    let handler;
    if (!handler) {
        const hostname = window.location.hostname;
        if (hostname.includes("chat.mistral")) {
            handler = new MistralHandler();
        } else if (hostname.includes("chatgpt.com")) {
            handler = new ChatGPTHandler();
        } else {
            console.error("hostname does not match a handler");
        }
    }

    const dom_observer = new MutationObserver(async (mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                await handler.handle_mutation(node);
            }
        }
    });
    dom_observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    function reset_page() {
        handler.reset_page();
    };

    if ('navigation' in window) {
        window.navigation.addEventListener("navigate", (event) => {
            console.info('navigation fired: ', event);
            reset_page();
        });
    };
    // handle the current page if the extension just got loaded
    if (document.body) {
        handler.handle_mutation(document.body);
    }
})();
