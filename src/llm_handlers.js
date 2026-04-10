/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import sidebar_module from './sidebar.js';


function _itemize_prompt(article, message_id) {
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
  return item;
}

const MistralHandler = (() => {
  // Handler for Mistral Le Chat webchat at https://chat.mistral.ai/*
  let seen = new WeakSet();
  let last_prompt;

  function _handle_node(node) {
    seen.add(node);
    const role = node.getAttribute?.('data-message-author-role');
    if (role === 'user') {
      const message_id = node.getAttribute?.('data-message-id');
      const item = _itemize_prompt(node, message_id);
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
});

const ChatGPTHandler = (() => {
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
      _itemize_prompt(a);
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
