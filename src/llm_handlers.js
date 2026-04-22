/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import sidebar_module from "./sidebar";

/**
 * Base class of handlers
 * @abstract
 */
class BaseHandler {
  _seen;        // WeakSet
  _last_prompt; // last prompt node

  constructor() {
    this._seen = new WeakSet();
    if ('navigation' in window) {
      window.navigation.addEventListener("navigate", (/*event*/) => {
        this.reset_page();
      })
    }
  };

  /**
   * @abstract
   */
  handle_mutation(/*mutations*/) { }

  /**
  * Shared function to itemize a prompt to a quicklink in the sidebar.
  *
  * @param {DOM node} article
  * @param {string} message_id
  */
  itemize(article, message_id) {
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
  }
};

/**
 * Handler for Mistral's Le Chat
 * @extends BaseHandler
 */
export class MistralHandler extends BaseHandler {

  constructor() {
    super();
  }

  _handle_node(node) {
    this._seen.add(node);
    const role = node.getAttribute?.('data-message-author-role');
    if (role === 'user') {
      const message_id = node.getAttribute?.('data-message-id');
      this.itemize(node, message_id);
    } else if (role === 'assistant') {
      const answer_node = node.querySelector('div[data-message-part-type="answer"]');
      console.log('answer_node: ', answer_node);
      if (!answer_node) return;
      if (this._last_prompt) {
        this._last_prompt.dataset.answerId = node.id;
      }
    }
  }

  async handle_mutation(node) {
    if (this._seen.has(node) || node.id === "placeholder") return;
    if (node.tagName === 'DIV' && node.hasAttribute('data-message-author-role')) {
      this._handle_node(node);
    } else {
      const divs = node.querySelectorAll('div[data-message-author-role]');
      divs.forEach(div => {
        if (!(this._seen.has(div))) {
          this._handle_node(div);
        }
      });
    }
  }
};


export class ChatGPTHandler extends BaseHandler {
  // TODO: untested, unfinished.
  constructor() {
    super();
  }

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
      this.itemize(a);
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
