var MyExtension = (() => {
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
      _db = await openDB("LLMNotesDB", 1, {
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
      async saveArticle(prompt_hash, topic, prompt_content, answer_markdown, tags) {
        if (!prompt_hash || !topic || !prompt_content, !answer_markdown) {
          console.error("db.saveArticle failed with missing parameter(s)");
          return;
        }
        try {
          await _init();
          return;
          const tx = _db.transaction(["articles", "articles_tags"], "readwrite");
          const articlesStore = tx.objectStore("articles");
          const articlesTagsStore = tx.objectStore("articles_tags");
          const article_id = await articlesStore.add({
            topic,
            content,
            added_on: /* @__PURE__ */ new Date()
          });
          if (tags && tags.length > 0) {
            await Promise.all(
              tags.map(async (tag) => {
                await articlesTagsStore.add({
                  tag_id: tag.id,
                  article_id
                });
              })
            );
          }
          await tx.done;
        } catch (error) {
          console.error("db.saveArticle threw an error: ", error);
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
      async getTags() {
        try {
          await _init();
          return await _db.getAll("tags");
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
    const storage_button = document.createElement("button");
    storage_button.textContent = "Storage";
    storage_button.className = "big-button";
    storage_button.onclick = _open_storage_tab;
    const settings_button = document.createElement("button");
    settings_button.textContent = "Settings";
    settings_button.className = "big-button";
    settings_button.onclick = _open_settings_tab;
    sidebar.append(storage_button, settings_button);
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
          tags_cache.append(tag);
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
    function _open_storage_tab() {
      browser.runtime.sendMessage({
        action: "openStorageTab"
        // url: 'your-extension-page.html' // or any URL you want to open
      });
    }
    ;
    function _open_settings_tab() {
      browser.runtime.sendMessage({
        action: "openSettingsTab"
        // url: 'your-extension-page.html' // or any URL you want to open
      });
    }
    async function _saveArticles() {
      const tags = _gather_tags();
      console.debug("tags: ", tags);
      const articles = _gather_checked_articles();
      console.debug("articles: ", articles);
      _clear_checkboxes();
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
      console.debug("prompt_divs: ", prompt_divs);
      const results = prompt_divs.map((prompt_item) => {
        if (!prompt_item) return;
        const answer_id = prompt_item.dataset.answerId;
        if (!answer_id) return;
        const answer_node = document.querySelector(`div[id="${answer_id}"]`)?.querySelector('[data-message-part-type="answer"]');
        console.debug("answer node: ", answer_node);
        if (!answer_node) return;
        return { prompt: prompt_item.title, answer: answer_node, prompt_id: prompt_item.dataset.messageId };
      });
      console.debug("results: ", results);
      return prompt_divs;
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
    }
    /*
     * @abstract
     */
    handle_mutation() {
    }
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
    // Handler for Mistral Le Chat webchat at https://chat.mistral.ai/*
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
    function reset_page() {
      handler.reset_page();
    }
    ;
    if ("navigation" in window) {
      window.navigation.addEventListener("navigate", (event) => {
        console.info("navigation fired: ", event);
        reset_page();
      });
    }
    ;
    if (document.body) {
      handler.handle_mutation(document.body);
    }
  })();
})();
