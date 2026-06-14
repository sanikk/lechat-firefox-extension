var LLMNotes = (() => {
  // node_modules/idb/build/index.js
  var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
  var idbProxyableTypes;
  var cursorAdvanceMethods;
  function getIdbProxyableTypes() {
    return idbProxyableTypes || (idbProxyableTypes = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction
    ]);
  }
  function getCursorAdvanceMethods() {
    return cursorAdvanceMethods || (cursorAdvanceMethods = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey
    ]);
  }
  var transactionDoneMap = /* @__PURE__ */ new WeakMap();
  var transformCache = /* @__PURE__ */ new WeakMap();
  var reverseTransformCache = /* @__PURE__ */ new WeakMap();
  function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
      const unlisten = () => {
        request.removeEventListener("success", success);
        request.removeEventListener("error", error);
      };
      const success = () => {
        resolve(wrap(request.result));
        unlisten();
      };
      const error = () => {
        reject(request.error);
        unlisten();
      };
      request.addEventListener("success", success);
      request.addEventListener("error", error);
    });
    reverseTransformCache.set(promise, request);
    return promise;
  }
  function cacheDonePromiseForTransaction(tx) {
    if (transactionDoneMap.has(tx))
      return;
    const done = new Promise((resolve, reject) => {
      const unlisten = () => {
        tx.removeEventListener("complete", complete);
        tx.removeEventListener("error", error);
        tx.removeEventListener("abort", error);
      };
      const complete = () => {
        resolve();
        unlisten();
      };
      const error = () => {
        reject(tx.error || new DOMException("AbortError", "AbortError"));
        unlisten();
      };
      tx.addEventListener("complete", complete);
      tx.addEventListener("error", error);
      tx.addEventListener("abort", error);
    });
    transactionDoneMap.set(tx, done);
  }
  var idbProxyTraps = {
    get(target, prop, receiver) {
      if (target instanceof IDBTransaction) {
        if (prop === "done")
          return transactionDoneMap.get(target);
        if (prop === "store") {
          return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
        }
      }
      return wrap(target[prop]);
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    has(target, prop) {
      if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
        return true;
      }
      return prop in target;
    }
  };
  function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
  }
  function wrapFunction(func) {
    if (getCursorAdvanceMethods().includes(func)) {
      return function(...args) {
        func.apply(unwrap(this), args);
        return wrap(this.request);
      };
    }
    return function(...args) {
      return wrap(func.apply(unwrap(this), args));
    };
  }
  function transformCachableValue(value) {
    if (typeof value === "function")
      return wrapFunction(value);
    if (value instanceof IDBTransaction)
      cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
      return new Proxy(value, idbProxyTraps);
    return value;
  }
  function wrap(value) {
    if (value instanceof IDBRequest)
      return promisifyRequest(value);
    if (transformCache.has(value))
      return transformCache.get(value);
    const newValue = transformCachableValue(value);
    if (newValue !== value) {
      transformCache.set(value, newValue);
      reverseTransformCache.set(newValue, value);
    }
    return newValue;
  }
  var unwrap = (value) => reverseTransformCache.get(value);
  function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
      request.addEventListener("upgradeneeded", (event) => {
        upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
      });
    }
    if (blocked) {
      request.addEventListener("blocked", (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion,
        event.newVersion,
        event
      ));
    }
    openPromise.then((db2) => {
      if (terminated)
        db2.addEventListener("close", () => terminated());
      if (blocking) {
        db2.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
      }
    }).catch(() => {
    });
    return openPromise;
  }
  var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
  var writeMethods = ["put", "add", "delete", "clear"];
  var cachedMethods = /* @__PURE__ */ new Map();
  function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
      return;
    }
    if (cachedMethods.get(prop))
      return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, "");
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
      // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
      !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
    ) {
      return;
    }
    const method = async function(storeName, ...args) {
      const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
      let target2 = tx.store;
      if (useIndex)
        target2 = target2.index(args.shift());
      return (await Promise.all([
        target2[targetFuncName](...args),
        isWrite && tx.done
      ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
  }
  replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
  }));
  var advanceMethodProps = ["continue", "continuePrimaryKey", "advance"];
  var methodMap = {};
  var advanceResults = /* @__PURE__ */ new WeakMap();
  var ittrProxiedCursorToOriginalProxy = /* @__PURE__ */ new WeakMap();
  var cursorIteratorTraps = {
    get(target, prop) {
      if (!advanceMethodProps.includes(prop))
        return target[prop];
      let cachedFunc = methodMap[prop];
      if (!cachedFunc) {
        cachedFunc = methodMap[prop] = function(...args) {
          advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
        };
      }
      return cachedFunc;
    }
  };
  async function* iterate(...args) {
    let cursor = this;
    if (!(cursor instanceof IDBCursor)) {
      cursor = await cursor.openCursor(...args);
    }
    if (!cursor)
      return;
    cursor = cursor;
    const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
    ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
    reverseTransformCache.set(proxiedCursor, unwrap(cursor));
    while (cursor) {
      yield proxiedCursor;
      cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
      advanceResults.delete(proxiedCursor);
    }
  }
  function isIteratorProp(target, prop) {
    return prop === Symbol.asyncIterator && instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor]) || prop === "iterate" && instanceOfAny(target, [IDBIndex, IDBObjectStore]);
  }
  replaceTraps((oldTraps) => ({
    ...oldTraps,
    get(target, prop, receiver) {
      if (isIteratorProp(target, prop))
        return iterate;
      return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
      return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    }
  }));

  // src/db_module.js
  var db = /* @__PURE__ */ (() => {
    let _db;
    async function _openDB() {
      _db = await openDB("LLMNotesDB", 2, {
        upgrade(db2) {
          const tagsStore = db2.createObjectStore("tags", { keyPath: "id", autoIncrement: true });
          tagsStore.createIndex("name", "name", { unique: true });
          const articlesStore = db2.createObjectStore("articles", {
            keyPath: "id",
            autoIncrement: true
          });
          articlesStore.createIndex("topic", "topic", { unique: false });
          const articlesTagsStore = db2.createObjectStore("articles_tags", { keyPath: ["article_id", "tag_id"] });
          articlesTagsStore.createIndex("article_id", "article_id");
          articlesTagsStore.createIndex("tag_id", "tag_id");
        }
      });
    }
    async function _init() {
      try {
        if (!_db) await _openDB();
      } catch (error) {
        console.error("db._init() threw an error: ", error);
        throw error;
      }
    }
    return {
      /**
      * async function to save the article in the IndexedDb.
      *
      * @param {string} prompt_id
      * @param {string} topic
      * @param {string} markdown
      * @param {array} tags
      */
      async saveArticle(prompt_id, topic, markdown, tags) {
        if (!prompt_id || !topic || !markdown) {
          console.error("db.saveArticle failed with missing parameter(s)");
          return;
        }
        console.debug("Final product:");
        console.debug("prompt id: ", prompt_id);
        console.debug("topic: ", topic);
        console.debug("markdown: ", markdown);
        console.debug("tags: ", tags);
        try {
          await _init();
          const tx = _db.transaction(["articles", "articles_tags"], "readwrite");
          const articlesStore = tx.objectStore("articles");
          const articlesTagsStore = tx.objectStore("articles_tags");
          const article_id = await articlesStore.add({
            hash: prompt_id,
            topic,
            content: markdown,
            added_on: /* @__PURE__ */ new Date()
          });
          console.debug("saved article, next is tags");
          console.debug("article_id: ", article_id);
          console.debug("tags: ", tags);
          if (tags && tags.length > 0) {
            const promises = tags.map((tag) => {
              console.debug("article_id: ", article_id, ", tag: ", tag);
              articlesTagsStore.add({
                article_id,
                tag_id: Number(tag)
              });
            });
            await Promise.all(promises);
          }
          await tx.done;
        } catch (error) {
          console.error("db.saveArticle threw an error: ", error);
          throw error;
        }
      },
      async getArticlesAll() {
        try {
          await _init();
          const tx = _db.transaction("articles", "readonly");
          const store = tx.objectStore("articles");
          return store.getAll();
        } catch (error) {
          console.error("db.getArticlesAll threw an error: ", error);
          throw error;
        }
      },
      async getArticlesByTagId(tag_id) {
        try {
          await _init();
          const article_ids = await _db.getAllFromIndex("articles_tags", "tag_id", tag_id);
          if (!article_ids || article_ids.length === 0) return [];
          return await _db.getAllFromIndex("articles", "id", article_ids);
        } catch (error) {
          console.error("db.getArticlesByTagId threw an error: ", error);
          throw error;
        }
      },
      /**
      * Async function to load the tags from IndexedDb.
      *
      * @returns {array} of id,value pairs
      */
      async getTags() {
        try {
          await _init();
          return _db.getAll("tags");
        } catch (error) {
          console.error("db.getTags threw an error: ", error);
          throw error;
        }
      },
      async saveTag(name) {
        try {
          await _init();
          const tx = _db.transaction("tags", "readwrite");
          const id = await tx.objectStore("tags").add({
            name
          });
          await tx.done;
          return { id, name };
        } catch (error) {
          console.error("db.saveTag threw an error: ", error);
          throw error;
        }
      }
    };
  })();
  var db_module_default = db;

  // src/markdown_converter.js
  var markdown_converter = /* @__PURE__ */ (() => {
    const _handlers = {
      "P": (node) => _parse_p_text(node),
      "H1": (node) => `# ${node.textContent}`,
      "H2": (node) => `## ${node.textContent}`,
      "H3": (node) => `### ${node.textContent}`,
      "H4": (node) => `#### ${node.textContent}`,
      "H5": (node) => `##### ${node.textContent}`,
      "H6": (node) => `###### ${node.textContent}`,
      "HR": () => "___",
      "PRE": (node) => _format_code_block(node),
      "UL": (node) => _format_unordered_list(node),
      "OL": (node) => _format_ordered_list(node),
      "DIV": (node) => _format_table(node)
    };
    function _format_code_block(child) {
      const language = child.querySelector("span.text-sm.font-medium.text-subtle")?.textContent || "";
      const code = child.querySelector("code")?.textContent;
      return `\`\`\`${language}
${code}
\`\`\``;
    }
    ;
    function _format_ordered_list(child, indent = 0) {
      const returnable = [];
      let i = 1;
      for (const list_item of child.childNodes) {
        if (list_item.nodeName === "#text" && list_item.nodeValue === "\n") continue;
        returnable.push(`${" ".repeat(indent)}${i}. ${_parse_p_text(list_item, indent)}`);
        i++;
      }
      return returnable;
    }
    ;
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
    }
    ;
    function _handle_unordered_list_item(list_item, indent = 0) {
      if (!list_item) return void 0;
      const returnable = [];
      for (const child_node of list_item.childNodes) {
        const node_name = child_node.nodeName;
        if (node_name === "#text" && child_node.nodeValue === "\n") continue;
        if (node_name === "UL") {
          const ret = _format_unordered_list(child_node, indent + 2);
          if (ret && ret.length !== 0) {
            returnable.push(...ret);
          }
        } else if (node_name === "OL") {
          const ret = _format_ordered_list(child_node, indent + 2);
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
    }
    ;
    function _text_parser(node, indent = 0) {
      switch (node.nodeName) {
        case void 0:
          return;
        case "#text":
        case "CODE":
          return `${" ".repeat(indent)}${node.textContent} `;
        case "STRONG":
          return `${" ".repeat(indent)}**${node.textContent}** `;
        case "EM":
          return `${" ".repeat(indent)}*${node.textContent}* `;
      }
    }
    ;
    function _parse_p_text(node, indent = 0) {
      if (/^(STRONG|EM|#text)$/.test(node.nodeName)) {
        return _text_parser(node, indent);
      }
      let returnable = `${" ".repeat(indent)}`;
      for (const child_node of node.childNodes) {
        const ret = _text_parser(child_node, indent);
        if (ret) {
          returnable += ret;
        }
      }
      return returnable;
    }
    ;
    function _format_answer_node(answer_node) {
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
    }
    ;
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
        console.debug("decipher answer node: ", answer_node);
        const big_topic = _format_topic(topic);
        const answer_markdown = _format_answer_node(answer_node);
        if (!answer_markdown) return;
        const complete_markdown = [big_topic, prompt_text, ...answer_markdown];
        return complete_markdown.join("\n");
      }
    };
  })();
  var markdown_converter_default = markdown_converter;

  // src/sidebar.js
  var sidebar_module = (() => {
    const sidebar = document.createElement("div");
    sidebar.id = "tm-jump-sidebar";
    const prompt_list = document.createElement("div");
    const tags_picked = document.createElement("select");
    const tags_available = document.createElement("select");
    let tags_cache;
    _load_tags().catch((err) => {
      console.error("Sidebar failed to load tags: ", err);
    });
    const storage_tab_button = document.createElement("button");
    storage_tab_button.textContent = "StorageTab";
    storage_tab_button.className = "big-button";
    storage_tab_button.onclick = () => browser.runtime.sendMessage({
      action: "openStorageTab"
    });
    const settings_tab_button = document.createElement("button");
    settings_tab_button.textContent = "Reset";
    settings_tab_button.className = "big-button";
    settings_tab_button.onclick = () => console.debug("To be implemented");
    sidebar.append(storage_tab_button, settings_tab_button);
    const tags_input = document.createElement("input");
    tags_input.type = "text";
    tags_input.placeholder = "New tag";
    tags_input.maxLength = 64;
    tags_input.id = "tag-input";
    tags_input.style.backgroundColor = "darkgray";
    const tags_create_button = document.createElement("button");
    tags_create_button.textContent = "Create";
    tags_create_button.className = "tag-button";
    tags_create_button.onclick = async () => {
      try {
        const tag_name = tags_input.value.trim();
        if (!tag_name) return;
        const ret = await db_module_default.saveTag(tag_name);
        if (ret) {
          const tag = _optionize_tag(ret);
          tags_available.appendChild(tag);
          tags_cache.push(tag);
        }
        tags_input.value = "";
      } catch (error) {
        console.error("error creating a tag: ", error);
      }
    };
    sidebar.append(tags_input, tags_create_button);
    tags_available.className = "tag-list";
    tags_available.multiple = true;
    sidebar.append(tags_available);
    const tags_add_button = document.createElement("button");
    tags_add_button.textContent = "Add";
    tags_add_button.className = "tag-button";
    tags_add_button.onclick = () => {
      [...tags_available.selectedOptions].forEach((opt) => {
        tags_picked.append(opt);
      });
    };
    const tags_remove_button = document.createElement("button");
    tags_remove_button.textContent = "Remove";
    tags_remove_button.className = "tag-button";
    tags_remove_button.onclick = () => {
      [...tags_picked.selectedOptions].forEach((opt) => {
        tags_available.append(opt);
      });
    };
    sidebar.append(tags_add_button, tags_remove_button);
    tags_picked.className = "tag-list";
    tags_picked.multiple = true;
    sidebar.append(tags_picked);
    const store_button = document.createElement("button");
    store_button.textContent = "Store";
    store_button.className = "big-button";
    store_button.onclick = _saveArticles;
    const reset_button = document.createElement("button");
    reset_button.textContent = "Reset";
    reset_button.className = "big-button";
    reset_button.onclick = _clear_selections;
    sidebar.append(store_button, reset_button);
    const separator = document.createElement("div");
    separator.innerHTML = `
            <div style="font-weight:bold; margin-bottom:8px;">
                Prompt
quicklinks
            </div>`;
    sidebar.appendChild(separator);
    sidebar.appendChild(prompt_list);
    async function _saveArticles() {
      const tags = _gather_tags();
      console.debug("_saveArticles tags: ", tags);
      const articles = _gather_checked_articles();
      console.debug("_saveArticles articles: ", articles);
      for (const { prompt_id, topic, prompt_text, answer_node } of articles) {
        const markdown = markdown_converter_default.html_to_markdown(topic, prompt_text, answer_node);
        console.debug("_saveArticles prompt_id: ", prompt_id, ", topic: ", topic, ", markdown: ", markdown, ", tags: ", tags);
        db_module_default.saveArticle(prompt_id, topic, markdown, tags);
      }
      _clear_selections();
    }
    function _optionize_tag(tag) {
      if (!tag) return;
      const { id, name } = tag;
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = name;
      return opt;
    }
    async function _load_tags() {
      if (!tags_cache) {
        try {
          const tags = await db_module_default.getTags();
          tags_cache = tags.map((tag) => _optionize_tag(tag));
        } catch (err) {
          console.error("Failed to load tags:", err);
          throw err;
        }
      }
      tags_picked.replaceChildren();
      tags_available.replaceChildren(...tags_cache);
    }
    function _gather_tags() {
      const tags = [...tags_picked.querySelectorAll("option")].map((tag) => tag.value);
      return tags;
    }
    function _gather_checked_articles() {
      const checkboxes = [...prompt_list.querySelectorAll('input[type="checkbox"]:checked')];
      if (!checkboxes || checkboxes.length === 0) return;
      const prompt_divs = checkboxes.map((checkbox) => {
        return checkbox?.parentElement;
      });
      console.debug("_gather_checked_articles prompt_divs: ", prompt_divs);
      const results = prompt_divs.map((prompt_item) => {
        if (!prompt_item) return;
        const answer_id = prompt_item.dataset.answerId;
        if (!answer_id) return;
        const answer_node = document.querySelector(`div[id="${answer_id}"]`)?.querySelector('[data-message-part-type="answer"]');
        console.debug("_gather_checked_articles answer node: ", answer_node);
        if (!answer_node) return;
        return { prompt_id: prompt_item.dataset.messageId, topic: prompt_item.querySelector("span")?.textContent, prompt_text: prompt_item.title, answer_node };
      });
      console.debug("results: ", results);
      return results;
    }
    ;
    function _clear_selections() {
      const checkboxes = prompt_list.querySelectorAll("input");
      checkboxes.forEach((cb) => {
        cb.checked = false;
      });
      _load_tags();
    }
    ;
    if ("navigation" in window) {
      window.navigation.addEventListener("navigate", () => {
        prompt_list.replaceChildren();
      });
    }
    ;
    return {
      getSidebar() {
        return sidebar;
      },
      addToPromptList(prompt) {
        prompt_list.appendChild(prompt);
      }
    };
  })();
  var sidebar_default = sidebar_module;

  // src/llm_handlers.js
  var BaseHandler = class {
    _seen;
    // WeakSet
    _last_prompt;
    // last prompt node
    constructor() {
      this._seen = /* @__PURE__ */ new WeakSet();
      if ("navigation" in window) {
        window.navigation.addEventListener("navigate", () => {
          this.reset_page();
        });
      }
    }
    /**
     * @abstract
     */
    handle_mutation() {
    }
    /**
    * Shared function to itemize a prompt to a quicklink in the sidebar.
    *
    * @param {DOM node} article
    * @param {string} message_id
    */
    itemize(article, message_id) {
      const prompt_text = article.innerText.trim();
      if (!prompt_text) return;
      const item2 = document.createElement("div");
      item2.title = prompt_text;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const text_item2 = document.createElement("span");
      checkbox.value = text_item2;
      item2.appendChild(checkbox);
      text_item2.textContent = prompt_text.split(".")[0].slice(0, 50);
      item2.dataset.messageId = message_id;
      item2.dataset.answerId = void 0;
      text_item2.onclick = () => {
        article.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      item2.appendChild(text_item2);
      this._last_prompt = item2;
      sidebar_default.addToPromptList(item2);
    }
    reset_page() {
      this._seen = /* @__PURE__ */ new WeakSet();
    }
  };
  var MistralHandler = class extends BaseHandler {
    constructor() {
      super();
    }
    _handle_node(node) {
      this._seen.add(node);
      const role = node.getAttribute?.("data-message-author-role");
      if (role === "user") {
        const message_id = node.getAttribute?.("data-message-id");
        this.itemize(node, message_id);
      } else if (role === "assistant") {
        const answer_node = node.querySelector('div[data-message-part-type="answer"]');
        console.log("answer_node: ", answer_node);
        if (!answer_node) return;
        if (this._last_prompt) {
          this._last_prompt.dataset.answerId = node.id;
        }
      }
    }
    async handle_mutation(node) {
      if (this._seen.has(node) || node.id === "placeholder") return;
      if (node.tagName === "DIV" && node.hasAttribute("data-message-author-role")) {
        this._handle_node(node);
      } else {
        const divs = node.querySelectorAll("div[data-message-author-role]");
        divs.forEach((div) => {
          if (!this._seen.has(div)) {
            this._handle_node(div);
          }
        });
      }
    }
  };
  var ChatGPTHandler = class extends BaseHandler {
    // TODO: untested, unfinished.
    constructor() {
      super();
    }
    _old_itemize(article) {
      const prompt = article.querySelector('[data-message-author-role="user"]');
      text_item.dataset.messageId = prompt.getAttribute?.("data-message-id");
      text_item.onclick = () => {
        article.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      item.appendChild(text_item);
      sidebar_default.addToPromptList(item);
    }
    _handle_node(node) {
      this._seen.add(node);
      const role = node.getAttribute("data-turn");
      if (role === "user") {
        this.itemize(a);
      } else if (role === "assistant") {
        if (this._last_prompt) {
          this._last_prompt.dataset.answerId = node.id;
        }
      } else {
        console.error("Role was not 'user' or 'assistant'");
      }
    }
    async handle_mutation(node) {
      if (_seen.has(node)) return;
      if (node.matches?.("article")) {
        this._handle_node(node);
      } else {
        const articles = node.querySelectorAll?.("article");
        articles.forEach((article) => {
          if (!this._seen.has(article)) {
            this._handle_node(article);
          }
        });
      }
    }
  };

  // src/background_comms.js
  var background_comms = (() => {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("background_comms message: ", message);
      console.log("background_comms sender: ", sender);
      if (sender.id === browser.runtime.id) {
        switch (message.type) {
          case "GET_ALL_ARTICLES":
            return db_module_default.getArticlesAll();
        }
      }
    });
  })();

  // src/main.js
  (async function() {
    "use strict";
    document.body.appendChild(sidebar_default.getSidebar());
    let handler;
    if (!handler) {
      const hostname = window.location.hostname;
      if (hostname.includes("chat.mistral")) {
        handler = new MistralHandler();
      } else if (hostname.includes("chatgpt.com")) {
        handler = new ChatGPTHandler();
      } else {
        console.error("hostname does not match a handler");
      }
    }
    const dom_observer = new MutationObserver(async (mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          await handler.handle_mutation(node);
        }
      }
    });
    dom_observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    if (document.body) {
      handler.handle_mutation(document.body);
    }
  })();
})();
