/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import { openDB } from 'idb';
//import FlexSearch from 'flexsearch';


const db = (() => {
  let _db;

  // const searchIndex = new FlexSearch.Document({
  //   document: {
  //     id: 'id',
  //     index: ['content'],
  //   },
  // });

  async function _openDB() {
    _db = await openDB('LLMNotesDB', 3, {
      upgrade(db) {
        const tagsStore = db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true });
        tagsStore.createIndex('name', 'name', { unique: true });
        // Tag (id: int, name: str)

        const articlesStore = db.createObjectStore('articles', {
          keyPath: 'id',
          autoIncrement: true,
        });
        articlesStore.createIndex('topic', 'topic', { unique: false });
        articlesStore.createIndex('added_on', 'added_on', { unique: false });
        // Article (id: int, hash: str, topic: str, content: str, added_on: date) 

        const articlesTagsStore = db.createObjectStore('articles_tags', { keyPath: ['article_id', 'tag_id'] });
        articlesTagsStore.createIndex('article_id', 'article_id');
        articlesTagsStore.createIndex('tag_id', 'tag_id');
        // ArticleTag (article_id: int, tag_id: int)
      },
    });
  }

  async function _init() {
    try {
      if (!_db) await _openDB();
    } catch (error) {
      console.error('db._init() threw an error: ', error);
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
      // async saveArticle(prompt_id, topic, prompt_text, answer_node, tags) {
      // if (!prompt_id || !topic || !prompt_text || !answer_node) {
      if (!prompt_id || !topic || !markdown) {
        console.error('db.saveArticle failed with missing parameter(s)');
        return;
      }
      //const markdown = markdown_converter.html_to_markdown(topic, prompt_text, answer_node)
      console.debug('Final product:')
      console.debug('prompt id: ', prompt_id);
      console.debug('topic: ', topic);
      console.debug('markdown: ', markdown);
      console.debug('tags: ', tags);
      // return;
      try {
        await _init();
        const tx = _db.transaction(['articles', 'articles_tags'], 'readwrite');
        const articlesStore = tx.objectStore('articles');
        const articlesTagsStore = tx.objectStore('articles_tags');
        const article_id = await articlesStore.add({
          hash: prompt_id,
          topic: topic,
          content: markdown,
          added_on: new Date(),
        });
        console.debug('saved article, next is tags');
        console.debug('article_id: ', article_id);
        console.debug('tags: ', tags);
        if (tags && tags.length > 0) {
          const promises = tags.map(tag => {
            console.debug('article_id: ', article_id, ', tag: ', tag);
            articlesTagsStore.add({
              article_id: article_id,
              tag_id: Number(tag),
            });
          });
          await Promise.all(promises);
        }
        await tx.done;
      } catch (error) {
        console.error('db.saveArticle threw an error: ', error);
        throw error;
      }
    },

    async getArticlesAll() {
      try {
        await _init();
        const tx = _db.transaction('articles', 'readonly');
        const store = tx.objectStore('articles');
        return store.getAll();
      } catch (error) {
        console.error('db.getArticlesAll threw an error: ', error);
        throw error;
      }
      //  try {
      //    await _init();
      //    return _db.getAll('articles');
      //  } catch (error) {
      //    console.error('db.getArticlesAll threw an error: ', error);
      //    throw error;
      //  }
    },

    async getArticlesLatest(amount = 20) {
      try {
        await _init();
        const returnable = [];
        const tx = _db.transaction('articles', 'readonly');
        const store = tx.objectStore('articles');
        const index = store.index('added_on');
        var i = 0;
        index.openCursor().onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && i < amount) {
            const entry = document.createElement('div');

            returnable.push(entry);
          }
        }

      } catch (error) {
        console.error('db.getArticlesLatest threw an error: ', error);
        throw error;
      }
    },

    async getArticlesByTagId(tag_id) {
      // TODO: test this out when the front can support it
      try {
        await _init();
        const article_ids = await _db.getAllFromIndex('articles_tags', 'tag_id', tag_id);
        if (!article_ids || article_ids.length === 0) return [];
        return await _db.getAllFromIndex('articles', 'id', article_ids);
        //const articles = await Promise.all(article_ids.map(id => _db.getFromIndex('articles', 'id', id)));
        //return articles.filter(article => article !== undefined);
      } catch (error) {
        console.error('db.getArticlesByTagId threw an error: ', error);
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
        return _db.getAll('tags');
      } catch (error) {
        console.error('db.getTags threw an error: ', error);
        throw error;
      }
    },

    async saveTag(name) {
      try {
        await _init();
        // if (!_db) await _openDB();
        const tx = _db.transaction('tags', 'readwrite');
        const id = await tx.objectStore('tags').add({
          name: name,
        });
        await tx.done;
        return { id: id, name: name };
      } catch (error) {
        console.error('db.saveTag threw an error: ', error);
        throw error;
      }
    },
  };
})();

export default db;
