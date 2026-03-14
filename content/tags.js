/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
//import db from './backend_comms.js'
import db from './db_module.js'

export function optionize_tag(tag, listAvailable) {
  // Makes a tag row into an <option> for <select>
  if (!tag || !listAvailable) return;
  const { id, name } = tag;
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = name;
  listAvailable.appendChild(opt);
}

export async function load_tags(list_available) {
  // Loads tags from the backend
  if (!list_available) return;
  try {
    list_available.replaceChildren();
    const tags = await db.getTags();
    tags.forEach((tag) => optionize_tag(tag, list_available));

  } catch (err) {
    console.error('Failed to load tags:', err);
  }
}
