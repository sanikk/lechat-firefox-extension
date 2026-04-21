/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

const markdown_converter = (() => {
  // markdown converter module to convert an answer node to markdown format

  const _handlers = {
    "P": (node) => _parse_p_text(node),
    "H1": (node) => `# ${node.textContent}`,
    "H2": (node) => `## ${node.textContent}`,
    "H3": (node) => `### ${node.textContent}`,
    "H4": (node) => `#### ${node.textContent}`,
    "H5": (node) => `##### ${node.textContent}`,
    "H6": (node) => `###### ${node.textContent}`,
    "HR": (/*node*/) => "___",
    "PRE": (node) => _format_code_block(node),
    "UL": (node) => _format_unordered_list(node),
    "OL": (node) => _format_ordered_list(node),
    "DIV": (node) => _format_table(node),
  };

  function _format_code_block(child) {
    const language = child.querySelector('span.text-sm.font-medium.text-subtle')?.textContent || '';
    const code = child.querySelector('code')?.textContent;
    return `\`\`\`${language}\n${code}\n\`\`\``;
  };


  function _format_ordered_list(child) {
    // if (!child || !child.childNodes || child.children.length === 0) return;
    if (!child?.childNodes?.length > 0) return;
    let returnable = '';
    for (let i = 0; i < child.children.length; i++) {
      const line_item = child.children[i] || undefined;
      if (line_item) {
        returnable += `${i} ${line_item.textContent.trim()}\n`;
      }
    }
    return returnable;
  };

  function _format_unordered_list(child, indent = 0) {
    if (!child || !child.children || child.children.length === 0) return;
    let returnable = [];
    for (const child_node of child.childNodes) {
      if (!child_node || (child_node.nodeValue && child_node.nodeValue === '\n')) continue;
      returnable.push(_handle_list_item(child_node, "- {{content}}", 0));
    }
  };

  function _handle_list_item(list_item, template, indent = 0) {
    // TODO: detect for nested unordered list.
    if (!list_item || !list_item.childNodes?.length > 0) return undefined;
    let first = true;
    returnable = "";
    for (const child_node of list_item.childNodes) {
      if (!child_node || (child_node.nodeValue && child_node.nodeValue === '\n')) continue;
      if (first) {
        returnable += `${' '.repeat(indent)}${template.replace('{{content}}', _parse_p_text(child_node))}`;
        first = false;
      } else {
        returnable += `${' '.repeat(indent + 2)}${_parse_p_text(child_node)}`;
      }
    }
  };

  function _parse_p_text(child, indent = 0) {
    // parses a <p> of text to markdown
    if (!child || !child.childNodes?.length > 0) return;
    if (child.childNodes.length === 1) return `${' '.repeat(indent)}${child.innerText}`;
    let returnable = `${' '.repeat(indent)}`;
    for (const child_node of child.childNodes) {
      switch (child_node?.nodeName) {
        case undefined: continue;
        case '#text':
          returnable += child_node.textContent + " ";
          continue;
        case "STRONG":
          returnable += `**${child_node.textContent}** `;
          continue;
        case "EM":
          returnable += `*${child_node.textContent}* `;
          continue;
        case "CODE":
          returnable += `${child_node.textContent} `;
          continue;
      }
    }
    return returnable.trim();
  };

  return {
    async formatNode(node) {
      // Function for formatting a Nodes contents to Markdown.
      if (!node) return;
      console.debug('formatNode. node.childNodes: ', node.childNodes);
      if (!node.childNodes || node.childNodes.length === 0) {
        console.error('fast exit from formatNode! node: ', node);
        return;
      }
      let markdown = [];
      for (const child_node of node.childNodes) {
        if (child_node.nodeValue && child_node.nodeValue === '\n') continue;
        const handler = _handlers[child_node.nodeName];
        markdown.push(handler(child_node));
      }
      console.debug(markdown);
    },

    async format_prompt(prompt_text) {
      // TODO: ok not sure about this, if it's needed at all
      const parsed = _parse_p_text(prompt_text);
      console.debug('prompt_text parsed: ', parsed);

    }
  }
})();

export default markdown_converter;
