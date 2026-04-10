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
    //"#text": "\n",
    "HR": "",
    // "A": "[{{content}}]({{href}})",
  };


  function _formatChild(child) {
    if (!child) throw new Error("No child in child: ", child);
    if (!child.nodeName) throw new Error("No nodeName in child: ", child);
    const markdown_template = _tagToMarkdown[child.nodeName] || '';
    console.debug('child: ', child);
    console.debug('template: ', markdown_template);
    switch (child.nodeName) {
      case "PRE":
        _formatCodeContents();
        console.debug('code block: ', child);
        return "";
      case "DIV":
        // got this from a table
        console.debug('div block: ', child);
        return "";
      case "UL":
        //_formatUnorderedListContentsSeq(child_node.children, "- {{content}}");
        console.debug('unordered list: ', child);
        return "";
      case "OL":
        _formatOrderedList(child.children);
        console.debug('ordered list: ', child);
        return "";
      case "#text":
      case "HR": return "___";

      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "P":
        return markdown_template.replace("{{content}}", child.textContent);
      default:
        console.debug('unknown html tag: ', html_tag);
        return "";
    }
  };

  function _formatOrderedList(child) {
    if (!child || !child.children || child.children.length === 0) return;
    let returnable = '';
    for (let i = 0; i < child.children.length; i++) {
      const line_item = child.children[i] || undefined;
      if (line_item) {
        returnable += `${i} ${line_item.textContent.trim()}\n`;
      }
    }
    return returnable;
  };


  //   function _formatOrderedListContentsSeq(list_items) {
  //     const formatted_list = list_items.map(
  //       (item, i) => {
  //         if (item.textContent === "\n") return;
  // 
  //         return template.replace("{{content}}", item.innerText).replace("{{i}}", i);
  //       }
  //     );
  //     console.debug("formatted_list: ", formatted_list);
  //     return formatted_list.join("\n");
  //   };

  function _formatUnorderedList(child) {


  };
  //   function _formatUnorderedListContentsSeq(node_children) {
  //     const formatted_list = node_children.map(
  //       async (list_item) => {
  //         let nested;
  //         for (const child of list_item.children) {
  //           if (child.nodeName && child.nodeName === "UL") {
  //             console.debug("found a nested list!");
  //             nested = await _formatUnorderedListContentsSeq(child.children);
  //           }
  //         }
  //         return "".replace("{{content}}", nested || list_item.innerText);
  //       }
  //     );
  //     console.debug("formatted_list: ", formatted_list);
  //     return formatted_list.join("\n");
  //   };
  function _formatCodeContents() {

  };

  return {
    async formatNode(node) {
      // Function for formatting a Nodes contents to Markdown.
      if (!node) return;
      console.debug('formatNode. node.children: ', node.children);
      if (!node.children || node.children.length === 0) {
        console.debug('fast exit from formatNode!');
        return;
      }
      let markdown = '';
      for (const child of node.children) {
        markdown += _formatChild(child) + '\n';
      }
      //const formatted_node = await Promise.all(node.children.map(child => { _formatChild(child) }));
      //console.debug(formatted_node);
      // console.debug('formatted_node: ', formatted_node);
      // if (!node.childNodes || node.childNodes.length === 0) return;
      // const markdown_forof = [];
      // for (const childNode of node.childNodes.values()) {
      // markdown_forof.push(_formatChildNodeSeq(childNode));
      // }
      // console.debug('markdown: ', markdown_forof);
      // const markdown = await Promise.all(node.childNodes.values().map(
      //   async (childNode) => {
      //     return _formatChildNode(childNode);
      //   }));

      // this.arraysEqual(markdown_forof, markdown);
      console.debug(markdown);
    },
  }
})();

export default markdown_converter;
