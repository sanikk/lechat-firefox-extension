/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

function itemize(article, prompt_list) {
  // Adds a quicklink to the "prompts" sidebar
  const prompt_text = article.innerText.trim();
  if (!prompt_text) return;

  const item = document.createElement('div');
  item.title = prompt_text;
  const data_message_id = prompt.getAttribute?.('data-message-id');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  const text_item = document.createElement('span');
  checkbox.value = text_item;
  item.appendChild(checkbox);

  text_item.textContent = prompt_text.split('.')[0].slice(0, 50);
  text_item.dataset.data_message_id = data_message_id;
  text_item.onclick = () => {
    article.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  item.appendChild(text_item);
  prompt_list.appendChild(item);
}



export async function handle_mutations(mutations, seen, prompt_list) {
  // DOM change handler
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (seen.indexOf(node) !== -1) continue;
      if (node.id === "placeholder") continue;
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV' && node.hasAttribute('data-message-author-role')) {
        seen.push(node);
        if (node.getAttribute?.('data-message-author-role') == 'user') itemize(node, prompt_list);
      } else {
        const divs = node.querySelectorAll('div[data-message-author-role]');
        divs.forEach(div => {
          seen.push(div);
          if (div.getAttribute?.('data-message-author-role') == 'user') itemize(div, prompt_list);
        });
      }
    }
  }
}
