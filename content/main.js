/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import Sidebar from './sidebar.js';
import { MistralHandler, ChatGPTHandler } from './llm_handlers.js';

(async function() {

    'use strict';

    let seen = new WeakSet();
    let answer_map = new WeakMap();
    const sidebar = new Sidebar();
    document.body.appendChild(sidebar.sidebar);
    let handler;
    if (!handler) {
        const hostname = window.location.hostname;
        if (hostname.includes("chat.mistral")) {
            handler = new MistralHandler(seen, sidebar.prompt_list, answer_map);
        } else if (hostname.includes("chatgpt.com")) {
            handler = new ChatGPTHandler(seen, sidebar.prompt_list, answer_map);
        } else {
            console.error("hostname does not match a handler");
        }
    }

    sidebar.store_button.onclick = async () => {
        const tags = [...sidebar.tags_picked_list.querySelectorAll('option')].map(tag => tag.value);

        const checkboxes = [...sidebar.prompt_list.querySelectorAll('input[type="checkbox"]:checked')];
        if (!checkboxes || checkboxes.length === 0) return;

        const prompt_divs = checkboxes.map(checkbox => {
            return checkbox?.parentElement;
        });

        for (const prompt_div of prompt_divs) {
            if (!prompt_div) continue;
            const span = prompt_div.querySelector('span');
            if (!span) continue;
            const answer_node = answer_map.get(prompt_div);
            console.log('store button answer_node', answer_node);

            continue;
            await db.saveArticle(
                span.dataset.MessageId,     // prompt_hash
                span.innerText,             // topic
                div.title,                  // prompt_content
                span.dataset.answerHtml,    // answer_content
                tags);                      // list of tags
        }
    };
    const dom_observer = new MutationObserver(async (mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof HTMLElement) || seen.has(node)) continue;
                await handler.handle_mutation(node);
            }
        }
    });
    dom_observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    function reset_page() {
        seen = new WeakSet();
        answer_map = new WeakMap();
        handler.reset_page(seen, answer_map);
    };

    if ('navigation' in window) {
        window.navigation.addEventListener("navigate", (/*event*/) => {
            console.info('navigation fired');
            sidebar.prompt_list.replaceChildren();
            reset_page();
            handler.handle_mutation(document.body);
        });
    };
    try {
        await sidebar.load_tags();
    } catch (error) {
        console.error('load_tags threw an error: ', error);
    }
    if (document.body) {
        handler.handle_mutation(document.body);
    }
})();
