/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

const db = (() => {
  return {
    async getTags() {
      try {
        const tags = await browser.runtime.sendMessage({ type: "getTags" });
        return tags;
      } catch (error) {
        console.error('failed to load tags from backend:\n', error);
        throw error;
      }
    },

    async saveTag(tag) {
      try {
        const ret = await browser.runtime.sendMessage({
          type: 'createTag',
          name: tag
        });
        return ret;
      } catch (error) {
        console.error('failed to save tag:\n', error);
        throw error;
      }
    },
  }
})();

export default db;
