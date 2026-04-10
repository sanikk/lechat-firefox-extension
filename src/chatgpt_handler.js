/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import sidebar_module from './sidebar.js';
import { itemize_prompt } from './llm_common.js';

const chatgpt_handler = (() => {
    //   _old_itemize(article) {
    //     // TODO: rip everything needed from here and delete this.
    //     const prompt = article.querySelector('[data-message-author-role="user"]');
    //     text_item.dataset.messageId = prompt.getAttribute?.('data-message-id');
    // 
    //     text_item.onclick = () => {
    //       article.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //     };
    //     item.appendChild(text_item);
    //     this._prompt_list.appendChild(item);
    //   }

    function _handle_node(node) {
        seen.add(node);
        const role = node.getAttribute('data-turn');
        if (role === 'user') {
            itemize_prompt(a);
        } else if (role === 'assistant') {
            if (last_prompt) {
                console.debug('node: ', node);
            }
        } else {
            console.error("Role was not 'user' or 'assistant'");
        }
    }
    return {

        async handle_mutation(node) {
            // Checks a provided node for things to handle. 
            // node can be document.body
            if (node.matches?.('article')) {
                _handle_node(node);
            } else {
                const articles = node.querySelectorAll?.('article');
                articles.forEach((article) => {
                    if (!(seen.has(article))) {
                        _handle_node(article);
                    }
                })
            }
        }
    }
});

'use strict';

document.body.appendChild(sidebar_module.getSidebar());

const dom_observer = new MutationObserver(mutations => {
    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;
            chatgpt_handler.handle_mutation(node);
        }
    }
});
dom_observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

// let's handle the DOM on extension reload:
chatgpt_handler.handle_mutation(document.body);

if ('navigation' in window) {
    window.navigation.addEventListener("navigate", (/*event*/) => {
        chatgpt_handler.reset_page();
        sidebar_module.resetPage();
    });
    // window.navigation.addEventListener("currententrychange", () => {
    //     console.info('currententrychange fired!');
    // });
};
