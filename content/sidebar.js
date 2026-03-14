/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import db from './db_module.js'


class Sidebar {
    constructor() {
        console.log('creating sidebar');
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

        this.reset_button.onclick = () => {
            const checkboxes = this.prompt_list.querySelectorAll('input');
            checkboxes.forEach((cb) => {
                cb.checked = false;
            });
        };
        this.store_button.onclick = () => {
            const tag_ids = [...this.list_picked_tags.querySelectorAll('option')].map(tag => tag.id);
            console.log('tags: ', tag_ids);


            const checkboxes = this.prompt_list.querySelectorAll('input[type="checkbox"]:checked');

            const end_products = Array.from(checkboxes).map(checkbox => {
                return checkbox?.parentElement?.querySelector('span');
            });

            console.log(end_products);
            // saveArticle(topic, content, model_id, tags) {
        };
    }
    create_selections_buttons() {
        const buttons_row = document.createElement('div');

        this.store_button = document.createElement('button');
        this.store_button.textContent = 'Store';
        this.store_button.className = 'big-button';

        this.reset_button = document.createElement('button');
        this.reset_button.textContent = 'Reset';
        this.reset_button.className = 'big-button';
        buttons_row.append(this.store_button, this.reset_button);
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
            const tag_name = tags_input.value.trim();
            if (!tag_name) return;
            const ret = await db.saveTag(tag_name);
            if (ret) {
                optionize_tag(ret, this.tags_available_list);
            }
            tags_input.value = '';
        };
        tags_add_row.append(tags_input, tags_create_button);
        tags_area.append(tags_add_row);

        this.tags_available_list = document.createElement('select');
        this.tags_available_list.className = 'tag-list';
        this.tags_available_list.multiple = true;
        tags_area.append(this.tags_available_list);

        const middleButtons = document.createElement('div');
        this.tags_add_button = document.createElement('button');
        this.tags_add_button.textContent = 'Add';
        this.tags_add_button.className = 'tag-button';
        this.tags_remove_button = document.createElement('button');
        this.tags_remove_button.textContent = 'Remove';
        this.tags_remove_button.className = 'tag-button';
        middleButtons.append(this.tags_add_button, this.tags_remove_button);
        tags_area.append(middleButtons);

        this.list_picked_tags = document.createElement('select');
        this.list_picked_tags.className = 'tag-list';
        this.list_picked_tags.multiple = true;
        tags_area.append(this.list_picked_tags);

        // Button funcs to MOVE tags between lists
        this.tags_add_button.onclick = () => {
            Array.from(this.tags_available_list.selectedOptions).forEach((opt) => {
                this.list_picked_tags.append(opt);
            });
        }
        this.tags_remove_button.onclick = () => {
            Array.from(this.list_picked_tags.selectedOptions).forEach((opt) => {
                this.tags_available_list.append(opt);
            });

        }
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
            const tags = await db.getTags();
            tags.forEach((tag) => this.optionize_tag(tag));

        } catch (err) {
            console.error('Failed to load tags:', err);
        }
    }
}

export default Sidebar;
