/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

import { itemize_prompt } from './llm_common.js';
import sidebar_module from './sidebar.js';

const mistral_handler = (() => {
    // Handler for Mistral Le Chat webchat at https://chat.mistral.ai/*
    let seen = new WeakSet();
    let last_prompt;

    function _handle_node(node) {
        seen.add(node);
        const role = node.getAttribute?.('data-message-author-role');
        if (role === 'user') {
            const message_id = node.getAttribute?.('data-message-id');
            const item = itemize_prompt(node, message_id);
            last_prompt = item;
            sidebar_module.addToPromptList(item);
        } else if (role === 'assistant') {
            const answer_node = node.querySelector('div[data-message-part-type="answer"]');
            if (!answer_node) return;
            if (last_prompt) {
                last_prompt.dataset.answerId = node.id;
            } else {
                console.error('answer node without prompt node?');
            }
        }
    }

    return {

        async handle_mutation(node) {
            // Checks a provided node for things to handle.
            // node can be document.body
            if (seen.has(node) || node.id === "placeholder") return;
            if (node.tagName === 'DIV' && node.hasAttribute('data-message-author-role')) {
                return _handle_node(node);
            } else {
                const divs = [...node.querySelectorAll('div[data-message-author-role]')].map(div => {
                    _handle_node(div);
                });
                return divs;
            }
        },
        reset_page() {
            seen = new WeakSet();
            last_prompt = undefined;
        },
        async get_answer_by_id(answer_id) {

            return document.querySelector(`div[id="${answer_id}"]`)?.querySelector('[data-message-part-type="answer"]');
        }
    };
})();

export default mistral_handler;
