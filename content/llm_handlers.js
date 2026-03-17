/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

/*
 * @abstract
 */
class BaseHandler {
  _seen;          // WeakSet
  _prompt_list;   // <div> in Sidebar
  last_prompt;    // last prompt node
  _answer_map;    // WeakMap of prompt_node,answer_node pairs

  constructor(seen, prompt_list, answer_map) {
    if (!seen || !prompt_list || !answer_map) throw new Error("Handler needs a 'seen', 'prompt_list' and 'answer_map'.");
    this._seen = seen;
    this._prompt_list = prompt_list;
    this._answer_map = answer_map;
  }

  /*
   * @abstract
   */
  handle_mutation(/*mutations*/) { }

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
    text_item.dataset.messageId = message_id;

    text_item.onclick = () => {
      article.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    item.appendChild(text_item);
    this.last_prompt = item;
    this._prompt_list.appendChild(item);
  }

  reset_page(seen, answer_map) {
    this._seen = seen;
    this._answer_map = answer_map;
  }
};

export class MistralHandler extends BaseHandler {
  // Handler for Mistral Le Chat webchat at https://chat.mistral.ai/*
  id = 'Mistral Le Chat';

  constructor(seen, prompt_list, answer_map) {
    super(seen, prompt_list, answer_map);
  }

  _handle_node(node) {
    // function to either
    // add prompt node as entry to prompt_list
    // OR
    // add answer node to a prompt node entry in prompt_list
    this._seen.add(node);
    const role = node.getAttribute?.('data-message-author-role');
    if (role === 'user') {
      const message_id = node.getAttribute?.('data-message-id');
      this.itemize(node, message_id);
    } else if (role === 'assistant') {
      const answer_node = node.querySelector('div[data-message-part-type="answer"]');
      if (!answer_node) return;
      console.log('answer_node: ', answer_node);
      console.log('answer_node.childNodes: ', answer_node.childNodes);
      if (this.last_prompt) {
        this._answer_map.set(this.last_prompt, answer_node);
      }
    }
  }

  async handle_mutation(node) {
    // Checks a provided node for things to handle.
    // node can be document.body
    if (node.id === "placeholder") return;
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
  constructor(seen, prompt_list, answer_map) {
    super(seen, prompt_list, answer_map);
  }

  _old_itemize(article) {
    // TODO: rip everything needed from here and delete this.
    const prompt = article.querySelector('[data-message-author-role="user"]');
    // const data_message_id = prompt.getAttribute?.('data-message-id'));
    text_item.dataset.messageId = prompt.getAttribute?.('data-message-id');

    text_item.onclick = () => {
      article.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    item.appendChild(text_item);
    this._prompt_list.appendChild(item);
  }

  _handle_node(node) {
    this._seen.add(node);
    const role = node.getAttribute('data-turn');
    if (role === 'user') {
      this.itemize(a);
    } else if (role === 'assistant') {
      console.log(node);
      // TODO: find the right bit inside.
      if (this.last_prompt) {
        this._answer_map.set(this.last_prompt, node);
      }
    } else {
      console.warn("Role was not 'user' or 'assistant'");
    }
  }

  async handle_mutation(node) {
    // Checks a provided node for things to handle. 
    // node can be document.body
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
