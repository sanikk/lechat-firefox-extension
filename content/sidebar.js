/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import db from './db_module.js'


class Sidebar {

    sidebar;
    prompt_list;
    store_button;
    tags_picked_list;
    tags_available_list;

    constructor() {
        this.sidebar = document.createElement('div');
        this.sidebar.id = 'tm-jump-sidebar';

        const controls_area = document.createElement('div');
        controls_area.appendChild(this.create_selections_buttons());
        controls_area.appendChild(this.create_tags_area());

        this.sidebar.appendChild(controls_area);

        const separator = document.createElement('div');
        separator.innerHTML = `
            <div style="font-weight:bold; margin-bottom:8px;">
                Prompts
            </div>`;
        this.sidebar.appendChild(separator);

        this.prompt_list = document.createElement('div');
        this.sidebar.appendChild(this.prompt_list);

    }
    create_selections_buttons() {
        // creates the 'store' and 'reset' buttons, places them in the sidebar
        // 'store' function gets defined in 'main'
        const buttons_row = document.createElement('div');

        this.store_button = document.createElement('button');
        this.store_button.textContent = 'Store';
        this.store_button.className = 'big-button';

        const reset_button = document.createElement('button');
        reset_button.textContent = 'Reset';
        reset_button.className = 'big-button';
        reset_button.onclick = () => {
            const checkboxes = this.prompt_list.querySelectorAll('input');
            checkboxes.forEach((cb) => {
                cb.checked = false;
            });
        };
        buttons_row.append(this.store_button, reset_button);
        return buttons_row;
    }

    create_tags_area() {
        const tags_area = document.createElement('div');

        const tags_add_row = document.createElement('div');

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
                    optionize_tag(ret, this.tags_available_list);
                }
                tags_input.value = '';
            } catch (error) {
                console.error('error creating a tag: ', error);
            }
        };
        tags_add_row.append(tags_input, tags_create_button);
        tags_area.append(tags_add_row);

        this.tags_available_list = document.createElement('select');
        this.tags_available_list.className = 'tag-list';
        this.tags_available_list.multiple = true;
        tags_area.append(this.tags_available_list);

        const middleButtons = document.createElement('div');

        const tags_add_button = document.createElement('button');
        tags_add_button.textContent = 'Add';
        tags_add_button.className = 'tag-button';
        tags_add_button.onclick = () => {
            [...this.tags_available_list.selectedOptions].forEach((opt) => {
                this.tags_picked_list.append(opt);
            });
        }
        const tags_remove_button = document.createElement('button');
        tags_remove_button.textContent = 'Remove';
        tags_remove_button.className = 'tag-button';
        tags_remove_button.onclick = () => {
            [...this.tags_picked_list.selectedOptions].forEach((opt) => {
                this.tags_available_list.append(opt);
            });

        }
        middleButtons.append(tags_add_button, tags_remove_button);
        tags_area.append(middleButtons);

        this.tags_picked_list = document.createElement('select');
        this.tags_picked_list.className = 'tag-list';
        this.tags_picked_list.multiple = true;
        tags_area.append(this.tags_picked_list);

        return tags_area;
    }

    optionize_tag(tag) {
        // Makes a tag row into an <option> for <select>
        if (!tag) return;
        const { id, name } = tag;
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = name;
        this.tags_available_list.appendChild(opt);
    }

    async load_tags() {
        // Loads tags and puts them in the sidebar tags_available_list
        try {
            this.tags_available_list.replaceChildren();
            this.tags_picked_list.replaceChildren();
            const tags = await db.getTags();
            tags.forEach((tag) => this.optionize_tag(tag));
        } catch (err) {
            console.error('Failed to load tags:', err);
        }
    }
}

export default Sidebar;
