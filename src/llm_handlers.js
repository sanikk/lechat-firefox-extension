/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import sidebar_module from './sidebar.js';


/*
 * @abstract
 */
import sidebar_module from "./sidebar";

class BaseHandler {
  _seen;          // WeakSet
  _last_prompt;    // last prompt node

  constructor() {
    this._seen = new WeakSet();
  }


  /*
   * @abstract
   */
  handle_mutation(/*mutations*/) { }

  _itemize_prompt(article, message_id) {
    // Adds a quicklink to the "prompts" sidebar
    const prompt_text = article.innerText.trim();
    if (!prompt_text) return;

    const item = document.createElement('div');
    item.title = prompt_text;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const text_item = document.createElement('span');
    checkbox.value = text_item;
    item.appendChild(checkbox);

    text_item.textContent = prompt_text.split('.')[0].slice(0, 50);
    item.dataset.messageId = message_id;
    item.dataset.answerId = undefined;

    text_item.onclick = () => {
      article.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    item.appendChild(text_item);
    this._last_prompt = item;
    sidebar_module.addToPromptList(item);
  }

  reset_page() {
    this._seen = new WeakSet();
    this._last_prompt = undefined;
  }
};

export class MistralHandler extends BaseHandler {
  // Handler for Mistral Le Chat webchat at https://chat.mistral.ai/*
  constructor() {
    super();
  }

  _handle_node(node) {
    // function to either
    // add prompt node as entry to prompt_list
    // OR
    // add answer node to a prompt node entry in prompt_list
    //
    // node: div[data-message-author-role]
    this._seen.add(node);
    const role = node.getAttribute?.('data-message-author-role');
    if (role === 'user') {
      const message_id = node.getAttribute?.('data-message-id');
      sidebar_module.addToPromptList(this._itemize_prompt(node, message_id));
    } else if (role === 'assistant') {
      const answer_node = node.querySelector('div[data-message-part-type="answer"]');
      console.log('answer_node: ', answer_node);
      if (!answer_node) return;
      if (this._last_prompt) {
        this._last_prompt.dataset.answerId = node.id;

      } else {
        console.error('answer node without prompt node?');
        console.error('answer node: ', answer_node);
        console.error('last prompt: ', this._last_prompt);
      }
    }
  }

  async handle_mutation(node) {
    // Checks a provided node for things to handle.
    // node can be document.body
    if (this._seen.has(node) || node.id === "placeholder") return;
    if (node.tagName === 'DIV' && node.hasAttribute('data-message-author-role')) {
      return this._handle_node(node);
    } else {
      const divs = [...node.querySelectorAll('div[data-message-author-role]')].map(div => {
        this._handle_node(div);
      });
      return divs;
    }
  }

};


export class ChatGPTHandler extends BaseHandler {
  // TODO: untested, unfinished.
  constructor() {
    super();
  }

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
  _old_itemize(article) {
    // TODO: rip everything needed from here and delete this.
    const prompt = article.querySelector('[data-message-author-role="user"]');
    text_item.dataset.messageId = prompt.getAttribute?.('data-message-id');

    text_item.onclick = () => {
      article.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    item.appendChild(text_item);
    sidebar_module.addToPromptList(item);
  }

  _handle_node(node) {
    this._seen.add(node);
    const role = node.getAttribute('data-turn');
    if (role === 'user') {
      this._itemize_prompt(a);
    } else if (role === 'assistant') {
      if (this._last_prompt) {
        this._last_prompt.dataset.answerId = node.id;
      }
    } else {
      console.error("Role was not 'user' or 'assistant'");
    }
  }

  async handle_mutation(node) {
    // Checks a provided node for things to handle.
    // node can be document.body
    if (_seen.has(node)) return;
    if (node.matches?.('article')) {
      this._handle_node(node);
    } else {
      const articles = node.querySelectorAll?.('article');
      articles.forEach((article) => {
        if (!(this._seen.has(article))) {
          this._handle_node(article);
        }
      })
    }
  }
};
