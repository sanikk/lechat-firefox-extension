/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

export class Sidebar {
    constructor() {

        this.sidebar = document.createElement('div');
        this.sidebar.id = 'tm-jump-sidebar';

        const controls_area = document.createElement('div');
        controls_area.appendChild(this.create_selections_buttons());
        controls_area.appendChild(this.create_tag_area());

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
        const buttons_row = document.createElement('div');

        this.selections_store_button = document.createElement('button');
        this.selections_store_button.textContent = 'Store';
        this.selections_store_button.className = 'big-button';

        this.selections_reset_button = document.createElement('button');
        this.selections_reset_button.textContent = 'Reset';
        this.selections_reset_button.className = 'big-button';
        buttons_row.append(this.selections_store_button, this.selections_reset_button);
        return buttons_row;
    }

    create_tag_area() {
        const tag_area = document.createElement('div');

        const add_tag_row = document.createElement('div');

        const input_tag = document.createElement('input');
        input_tag.type = 'text';
        input_tag.placeholder = 'New tag';
        input_tag.maxLength = 64;
        input_tag.id = 'tag-input';
        input_tag.style.backgroundColor = 'darkgray';

        const tag_create_button = document.createElement('button');
        tag_create_button.textContent = 'Create';
        tag_create_button.className = 'tag-button';
        tag_create_button.addEventListener('click', async () => {
            const tag = input_tag.value.trim();
            if (!tag) return;
            const ret = await browser.runtime.sendMessage({
                type: 'createTag',
                name: tag
            });
            if (ret) {
                optionize_tag(ret);
            }
            input_tag.value = '';
        });
        add_tag_row.append(input_tag, tag_create_button);
        tag_area.append(add_tag_row);

        this.list_available_tags = document.createElement('select');
        this.list_available_tags.className = 'tag-list';
        this.list_available_tags.multiple = true;
        tag_area.append(this.list_available_tags);

        const middleButtons = document.createElement('div');
        this.tag_add_button = document.createElement('button');
        this.tag_add_button.textContent = 'Add';
        this.tag_add_button.className = 'tag-button';
        this.tag_remove_button = document.createElement('button');
        this.tag_remove_button.textContent = 'Remove';
        this.tag_remove_button.className = 'tag-button';
        middleButtons.append(this.tag_add_button, this.tag_remove_button);
        tag_area.append(middleButtons);

        this.list_picked_tags = document.createElement('select');
        this.list_picked_tags.className = 'tag-list';
        this.list_picked_tags.multiple = true;
        tag_area.append(this.list_picked_tags);
        return tag_area;
    }
}
