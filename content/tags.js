
function optionize_tag(tag, listAvailable) {
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
    const tags = await browser.runtime.sendMessage({ type: "getTags" });
    tags.forEach((tag) => optionize_tag(tag, list_available));

  } catch (err) {
    console.error('Failed to load tags:', err);
  }
}
