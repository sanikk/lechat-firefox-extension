/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

const markdown_converter = (() => {
  // markdown converter module to convert an answer node to markdown format

  const _tagToMarkdown = {
    "P": "{{content}}",
    "H1": "# {{content}}",
    "H2": "## {{content}}",
    "H3": "### {{content}}",
    "PRE": "```{{language}}\n{{content}}\n```",
    "CODE": "`{{content}}`",
    "#text": "\n",
    "HR": "",
    // "A": "[{{content}}]({{href}})",
  };

  function _convert_tag(html_tag) {
    return _tagToMarkdown[html_tag];
  };

  function _formatChildNodeSeq(child_node) {
    console.debug(child_node);
    const html_tag = child_node.nodeName;
    if (!html_tag) {
      throw new Error("nodeName in html tag in childnode: ", child_node);
    }
    const markdown_template = _convert_tag(html_tag) || '';
    switch (html_tag) {
      case "PRE":
        _formatCodeContents();
        console.debug('code block: ', child_node);
        return "";
      case "DIV":
        console.debug('div block: ', child_node);
        return "";
      case "UL":
        _formatUnorderedListContentsSeq(child_node.children, "- {{content}}");
        console.debug('unordered list: ', child_node);
        return "";
      case "OL":
        _formatOrderedListContentsSeq(child_node.children, "{{i}} {{content}}");
        console.debug('ordered list: ', child_node);
        return "";
      case "#text":
      case "HR": return "";

      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "P":
        return markdown_template.replace("{{content}}", child_node.textContent);
      default:
        console.debug('unknown html tag: ', html_tag);
        return "";
    }
  };

  async function _formatChildNode(child_node) {
    Promise.all(child_node.childNode.values().map(

    ));

  };
  function _formatOrderedListContentsSeq(list_items) {
    const formatted_list = list_items.map(
      (item, i) => {
        if (item.textContent === "\n") return;

        return template.replace("{{content}}", item.innerText).replace("{{i}}", i);
      }
    );
    console.debug("formatted_list: ", formatted_list);
    return formatted_list.join("\n");
  };

  function _formatUnorderedListContentsSeq(node_children, template) {
    const formatted_list = node_children.map(
      async (item) => {
        //if (item.textContent === "\n") return;
        if (item.children.length !== 0) await _formatUnorderedListContentsSeq(item.children);
        return template.replace("{{content}}", item.innerText);
      }
    );
    console.debug("formatted_list: ", formatted_list);
    return formatted_list.join("\n");
  };
  function _formatCodeContents() {

  };

  return {
    async formatNode(node) {
      // Function for formatting a Nodes contents to Markdown.
      if (!node) return;
      if (!node.childNodes || node.childNodes.length === 0) return;
      const markdown_forof = [];
      for (const childNode of node.childNodes.values()) {
        markdown_forof.push(_formatChildNodeSeq(childNode));
      }
      console.debug('markdown: ', markdown_forof);
      // const markdown = await Promise.all(node.childNodes.values().map(
      //   async (childNode) => {
      //     return _formatChildNode(childNode);
      //   }));

      // this.arraysEqual(markdown_forof, markdown);

    },

    arraysEqual(a, b) {
      if (a.length !== b.length) {
        console.debug('lengths are not the same, a: ', a.length, ', and b: ', b.length);
        return;
      }
      for (let i = 0; i < a.length; i++) {
        if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
          console.debug('element differs, a[', i, ']: ', a[i], ', while b[', i, ']: ', b[i]);
          return;
        }
      }
    }

    // formatMarkdown(template, text, href = null) {
    //   let result = template.replace("{{content}}", text);
    //   if (href) result = result.replace("{{href}}", href);
    //   return result;
    // }

  }
})();

export default markdown_converter;
