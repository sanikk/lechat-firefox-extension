/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

/**
* markdown converter module to convert an answer node to markdown format
*/
const markdown_converter = (() => {
  /**
   * Object lookup for DOM element conversions.
   */
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
    if (!child) return;
    const returnable = [];
    for (const list_item of child.children) {
      const ret = _handle_unordered_list_item(list_item, indent);
      if (Array.isArray(ret)) {
        returnable.push(...ret);
      } else if (ret) {
        returnable.push(ret);
      }
    }
    return returnable;
  };

  function _handle_unordered_list_item(list_item, indent = 0) {
    if (!list_item) return undefined;
    const returnable = [];
    for (const child_node of list_item.childNodes) {
      if (child_node.nodeName === "#text" && child_node.nodeValue === "\n") continue;
      if (child_node.nodeName === "UL") {
        const ret = _format_unordered_list(child_node, indent + 2);
        if (ret && ret.length !== 0) {
          returnable.push(...ret);
        }
      } else {
        const ret = _parse_p_text(child_node, indent);
        if (ret) {
          returnable.push(ret);
        }
      }
    }
    return returnable;

  };

  function _text_parser(node, indent = 0) {
    switch (node.nodeName) {
      case undefined:
        return;
      case '#text':
      case "CODE":
        return `${' '.repeat(indent)}${node.textContent} `;
      case "STRONG":
        return `${' '.repeat(indent)}**${node.textContent}** `;
      case "EM":
        return `${' '.repeat(indent)}*${node.textContent}* `;
    }
  };
  function _parse_p_text(node, indent = 0) {
    // parses a <p> of text to markdown
    if (/^(STRONG|EM|#text)$/.test(node.nodeName)) {
      return _text_parser(node, indent);
    }
    let returnable = `${' '.repeat(indent)}`;
    for (const child_node of node.childNodes) {
      const ret = _text_parser(child_node, indent);
      if (ret) {
        returnable += ret;
      }
    }
    return returnable;
  };

  function _format_answer_node(answer_node) {
    // Function for formatting a Nodes contents to Markdown.
    if (!answer_node) return;
    let markdown = [];
    for (const child_node of answer_node.children) {
      const handler = _handlers[child_node.nodeName];
      const ret = handler(child_node);
      if (Array.isArray(ret)) {
        markdown.push(...ret);
      } else {
        markdown.push(ret);
      }
    }
    return markdown;
  }

  function _format_topic(topic) {
    return `### ${topic}`;
  };

  return {
    /**
    * Function to convert prompt topic, prompt text and the LLM's answer to markdown.
    * Very naive, no extra safety mechanisms.
    *
    * @param {string} topic
    * @param {string} prompt_text
    * @param {DOM node} answer_node
    */
    html_to_markdown(topic, prompt_text, answer_node) {
      console.debug('decipher answer node: ', answer_node);
      const big_topic = _format_topic(topic);
      const answer_markdown = _format_answer_node(answer_node);
      if (!answer_markdown) return;
      const complete_markdown = [big_topic, prompt_text, ...answer_markdown];
      return complete_markdown.join('\n');
    }
  }
})();

export default markdown_converter;
