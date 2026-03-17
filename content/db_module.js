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
    _db = await openDB('LLMNotesDB', 1, {
      upgrade(db) {
        const tagsStore = db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true });
        tagsStore.createIndex('name', 'name', { unique: true });
        // Tag (id: int, name: str)

        //const llmStore = db.createObjectStore('llms', { keyPath: 'id', autoIncrement: true });
        //modelsStore.createIndex('name', 'name', { unique: true });
        // Model (id: int, name: str)

        const articlesStore = db.createObjectStore('articles', {
          keyPath: 'id',
          autoIncrement: true,
        });
        articlesStore.createIndex('topic', 'topic', { unique: false });
        // Article (id: int, topic: str, content: str, model_id: int, added_on: date) 

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

    async saveArticle(topic, content, tags) {
      // TODO: test this out
      if (!topic || !content) return;
      try {
        await _init();

        const tx = _db.transaction(['articles', 'articles_tags'], 'readwrite');
        const articlesStore = tx.objectStore('articles');
        const articlesTagsStore = tx.objectStore('articles_tags');

        const article_id = await articlesStore.add({
          topic: topic,
          content: content,
          added_on: new Date(),
        });

        if (tags && tags.length > 0) {
          await Promise.all(
            tags.map(async (tag) => {
              await articlesTagsStore.add({
                tag_id: tag.id,
                article_id: article_id,
              });
            })
          );
        }
        await tx.done;
      } catch (error) {
        console.error('db.saveArticle threw an error: ', error);
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

    async getTags() {
      try {
        await _init();
        return await _db.getAll('tags');
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
