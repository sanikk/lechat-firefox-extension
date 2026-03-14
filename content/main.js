/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import { Sidebar } from './sidebar.js';
import { MistralHandler, ChatGPTHandler } from './llm_handlers.js';
import { load_tags } from './tags.js';

(async function() {

    'use strict';

    const seen = [];
    const sidebar = new Sidebar();
    document.body.appendChild(sidebar.sidebar);
    let handler;
    // TODO: check if I can make this into a module, have the handler routines returned from handler_modules
    if (!handler) {
        const hostname = window.location.hostname;
        if (hostname.includes("chat.mistral")) {
            handler = new MistralHandler(seen, sidebar.prompt_list);
        } else if (hostname.includes("chatgpt.com")) {
            handler = new ChatGPTHandler(seen, sidebar.prompt_list);
        } else {
            console.log("hostname does not match a handler");
        }
    } else {
        console.log('prevented new handler');
    }
    const dom_observer = new MutationObserver(async (mutations) => {
        // TODO: maybe only do a bit less in the different handlers, most here
        // like for(....) bits.
        await handler.handle_mutations(mutations);
    });
    dom_observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    if ('navigation' in window) {
        window.navigation.addEventListener("navigate", (/*event*/) => {
            sidebar.prompt_list.replaceChildren();
            seen.length = 0;
        });
    }
    await load_tags(sidebar.list_available_tags);

})();
