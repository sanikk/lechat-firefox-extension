/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import db from './db_module.js'


const sidebar_module = (() => {

    const sidebar = document.createElement('div');
    sidebar.id = 'tm-jump-sidebar';
    const prompt_list = document.createElement('div');
    const tags_picked = document.createElement('select');
    const tags_available = document.createElement('select');
    let tags_cache;

    _load_tags().catch(err => {
        console.error('Sidebar failed to load tags: ', err);
    })

    const storage_button = document.createElement('button');
    storage_button.textContent = 'Storage';
    storage_button.className = 'big-button';
    storage_button.onclick = _open_storage_tab;
    const settings_button = document.createElement('button');
    settings_button.textContent = 'Settings';
    settings_button.className = 'big-button';
    settings_button.onclick = _open_settings_tab;
    sidebar.append(storage_button, settings_button);

    const tags_input = document.createElement('input');
    tags_input.type = 'text';
    tags_input.placeholder = 'New tag';
    tags_input.maxLength = 64;
    tags_input.id = 'tag-input';
    tags_input.style.backgroundColor = 'darkgray';
    const tags_create_button = document.createElement('button');
    tags_create_button.textContent = 'Create';
    tags_create_button.className = 'tag-button';
    tags_create_button.onclick = async () => {
        try {
            const tag_name = tags_input.value.trim();
            if (!tag_name) return;
            const ret = await db.saveTag(tag_name);
            if (ret) {
                const tag = _optionize_tag(ret);
                tags_available.appendChild(tag);
                tags_cache.push(tag);
            }
            tags_input.value = '';
        } catch (error) {
            console.error('error creating a tag: ', error);
        }
    };
    sidebar.append(tags_input, tags_create_button);

    tags_available.className = 'tag-list';
    tags_available.multiple = true;
    sidebar.append(tags_available);


    const tags_add_button = document.createElement('button');
    tags_add_button.textContent = 'Add';
    tags_add_button.className = 'tag-button';
    tags_add_button.onclick = () => {
        [...tags_available.selectedOptions].forEach((opt) => {
            tags_picked.append(opt);
        });
    };
    const tags_remove_button = document.createElement('button');
    tags_remove_button.textContent = 'Remove';
    tags_remove_button.className = 'tag-button';
    tags_remove_button.onclick = () => {
        [...tags_picked.selectedOptions].forEach((opt) => {
            tags_available.append(opt);
        });

    };
    sidebar.append(tags_add_button, tags_remove_button);

    tags_picked.className = 'tag-list';
    tags_picked.multiple = true;
    sidebar.append(tags_picked);

    const store_button = document.createElement('button');
    store_button.textContent = 'Store';
    store_button.className = 'big-button';
    store_button.onclick = _saveArticles;
    const reset_button = document.createElement('button');
    reset_button.textContent = 'Reset';
    reset_button.className = 'big-button';
    reset_button.onclick = _clear_selections;
    sidebar.append(store_button, reset_button);

    const separator = document.createElement('div');
    separator.innerHTML = `
            <div style="font-weight:bold; margin-bottom:8px;">
                Prompt\nquicklinks
            </div>`;
    sidebar.appendChild(separator);
    sidebar.appendChild(prompt_list);

    function _open_storage_tab() {
        browser.runtime.sendMessage({
            action: 'openStorageTab',
            // url: 'your-extension-page.html' // or any URL you want to open
        });
    };

    function _open_settings_tab() {
        browser.runtime.sendMessage({
            action: 'openSettingsTab',
            // url: 'your-extension-page.html' // or any URL you want to open
        });

    }


    async function _saveArticles() {
        const tags = _gather_tags();
        console.debug('tags: ', tags);
        const articles = _gather_checked_articles();
        console.debug('articles: ', articles);
        _clear_checkboxes();
    }

    function _optionize_tag(tag) {
        // Makes a tag row into an <option> for <select>
        // tag - id,name pair
        if (!tag) return;
        const { id, name } = tag;
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = name;
        return opt;
    }

    async function _load_tags() {
        // Loads tags and puts them in the sidebar tags_available_list
        if (!tags_cache) {
            try {
                const tags = await db.getTags();
                if (tags && tags.length !== 0) {
                    tags_cache = tags.map(tag => _optionize_tag(tag));
                    console.debug('tags_cache is ', tags_cache);
                } else {
                    tags_cache = [];
                }
            } catch (err) {
                console.error('Failed to load tags:', err);
                throw err;
            }
        }
        tags_picked.replaceChildren();
        tags_available.replaceChildren(...tags_cache);
    }

    function _gather_tags() {
        const tags = [...tags_picked.querySelectorAll('option')].map(tag => tag.value);
        return tags;
    }

    function _gather_checked_articles() {
        const checkboxes = [...prompt_list.querySelectorAll('input[type="checkbox"]:checked')];
        if (!checkboxes || checkboxes.length === 0) return;

        const prompt_divs = checkboxes.map(checkbox => {
            return checkbox?.parentElement;
        });
        console.debug('prompt_divs: ', prompt_divs);
        const results = prompt_divs.map(prompt_item => {
            if (!prompt_item) return;
            const answer_id = prompt_item.dataset.answerId;
            if (!answer_id) return;
            // TODO: ok this is dependant on handler.
            const answer_node = document.querySelector(`div[id="${answer_id}"]`)?.querySelector('[data-message-part-type="answer"]');
            console.debug('answer node: ', answer_node);
            if (!answer_node) return;
            return { prompt: prompt_item.title, answer: answer_node, prompt_id: prompt_item.dataset.messageId };
        });
        console.debug('results: ', results);
        return prompt_divs;
    };


    function _clear_selections() {
        const checkboxes = prompt_list.querySelectorAll('input');
        checkboxes.forEach((cb) => {
            cb.checked = false;
        });
        _load_tags();
    };

    if ('navigation' in window) {
        window.navigation.addEventListener("navigate", (/*event*/) => {
            prompt_list.replaceChildren();
        });
    };

    return {
        getSidebar() {
            return sidebar;
        },

        addToPromptList(prompt) {
            prompt_list.appendChild(prompt);
        },

    };
})();
export default sidebar_module;

