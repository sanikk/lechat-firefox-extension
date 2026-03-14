/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

class BaseHandler {
  seen;
  prompt_list;
  constructor(seen, prompt_list) {
    console.log('creating handler');
    this.seen = seen;
    this.prompt_list = prompt_list;
  }
  handle_mutations(/*mutations*/) {

  }
  mark_answer_node(answer_node) {
    const unanswered_prompts = this.prompt_list.querySelectorAll('[data-answer-node="null"]');
    if (unanswered_prompts.length > 0) {
      const most_recent_prompt = unanswered_prompts[unanswered_prompts.length - 1];
      most_recent_prompt.dataset.answerNode = answer_node;
    }
  }
};

export class MistralHandler extends BaseHandler {
  constructor(seen, prompt_list) {
    super(seen, prompt_list);
  }
  itemize(article) {
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
    text_item.dataset.messageId = article.getAttribute?.('data-message-id');
    text_item.dataset.answerNode = null;

    text_item.onclick = () => {
      article.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    item.appendChild(text_item);
    this.prompt_list.appendChild(item);
  }

  handle_node(node) {
    // function to either
    // add prompt node as entry to prompt_list
    // OR
    // add answer node to a prompt node entry in prompt_list
    this.seen.push(node);
    const role = node.getAttribute?.('data-message-author-role');
    if (role === 'user') {
      this.itemize(node);
    } else if (role === 'assistant') {
      this.mark_answer_node(node);
    }
  }

  async handle_mutations(mutations) {
    // DOM change handler
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (this.seen.indexOf(node) !== -1) continue;
        if (node.id === "placeholder") continue;
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV' && node.hasAttribute('data-message-author-role')) {
          this.handle_node(node);
        } else {
          const divs = node.querySelectorAll('div[data-message-author-role]');
          divs.forEach(div => {
            this.handle_node(div);
          });
        }
      }
    }
  }
};


export class ChatGPTHandler extends BaseHandler {
  // TODO: untested, unfinished.
  constructor(seen, prompt_list) {
    super(seen, prompt_list);
  }

  itemize(article) {
    // Adds a quicklink to the "prompts" sidebar
    const prompt = article.querySelector('[data-message-author-role="user"]');
    if (!prompt) return;
    const prompt_text = prompt.innerText.trim();
    if (!prompt_text) return;

    const item = document.createElement('div');
    item.title = prompt_text;
    // const data_message_id = prompt.getAttribute?.('data-message-id'));
    //const testid = article.getAttribute('data-testid');
    //const n = testid ? Math.floor(Number(testid.split('-').pop()) / 2 + 1) + ". " : "";

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const text_item = document.createElement('span');
    checkbox.value = text_item;
    item.appendChild(checkbox);


    text_item.textContent = prompt_text.split('.')[0].slice(0, 50);
    text_item.dataset.messageId = prompt.getAttribute?.('data-message-id');
    text_item.dataset.answerNode = null;

    text_item.onclick = () => {
      article.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    item.appendChild(text_item);
    this.prompt_list.appendChild(item);
  }

  handle_node(node) {
    this.seen.add(node);
    const role = node.getAttribute('data-turn');
    if (role === 'user') {
      this.itemize(a);
    } else if (role === 'assistant') {
      this.mark_answer_node(node);
    } else {
      console.warn("Role was not 'user' or 'assistant'");
    }
  }

  async handle_mutations(mutations) {
    // DOM change handler
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement) || this.seen.indexOf(node) !== -1) continue;

        if (node.matches?.('article')) {
          this.handle_node(node);
        } else {
          const articles = node.querySelectorAll?.('article');
          articles.forEach((article) => {
            this.handle_node(article);
          })
        }
      }
    }
  }
};
