import db_module from './db_module.js'

const entriesContainer = document.getElementById('entries');
entriesContainer.innerHTML = '';
const deleteSelectedButton = document.getElementById('delete-selected');
const exportSelectedButton = document.getElementById('export-selected');
const selectAllCheckbox = document.getElementById('select-all');

let selectedIds = new Set();
let sidebar_tab;

async function _init_sidebar_tab() {
  const tabs = await browser.tabs.query({ url: "https://chat.mistral.ai/*" });
  if (tabs.length > 0) {
    sidebar_tab = tabs[0].id;
  } else {
    console.error('storage_tab.init_sidebar_tab: No sidebar tab found!');
    throw new Error('No sidebar tab found!');
  }
}
async function _load_articles() {
  try {
    if (!sidebar_tab) return;
    const response = await browser.tabs.sendMessage(sidebar_tab, {
      type: 'GET_ALL_ARTICLES'
    })
    return response;
  } catch (error) {
    console.error('_load_articles error: ', error);
    throw error;
  }
}

async function _init() {
  try {
    await _init_sidebar_tab();
    const articles = await _load_articles();
    for (const article of articles) {
      _render_article(article);
    }
  } catch (error) {
    console.error('storage_tab._init threw: ', error);
  }
}

_init();

async function _render_article({ hash, topic, content }) {
  const article_item = document.createElement('div');
  article_item.className = 'article';
  article_item.title = content;
  article_item.innerHTML = `
      <div>
        <input
          type="checkbox"
          class="article-checkbox"
          data-id="${hash}"
          ${selectedIds.has(hash) ? 'checked' : ''}
        >
        <span class="topic-span" data-id="${hash}">${topic}</span>
        <button class="edit-button" data-id="${hash}">Edit</button>
      </div>
    `;
  entriesContainer.appendChild(article_item);
}

// function setupEventListeners() {
//   selectAllCheckbox.addEventListener('change', (e) => {
//     const checkboxes = document.querySelectorAll('.entry-checkbox');
//     for (const checkbox of checkboxes) {
//       checkbox.checked = e.target.checked;
//       const id = parseInt(checkbox.getAttribute('data-id'));
//       if (e.target.checked) selectedIds.add(id);
//       else selectedIds.delete(id);
//     }
//   });
//
//   entriesContainer.addEventListener('change', (e) => {
//     if (e.target.classList.contains('entry-checkbox')) {
//       const id = parseInt(e.target.getAttribute('data-id'));
//       if (e.target.checked) selectedIds.add(id);
//       else selectedIds.delete(id);
//     }
//   });
//
//   entriesContainer.addEventListener('click', async (e) => {
//     if (e.target.classList.contains('edit-button')) {
//       const id = parseInt(e.target.getAttribute('data-id'));
//       await editEntry(id);
//     }
//   });
//
//   deleteSelectedButton.addEventListener('click', async () => {
//     if (selectedIds.size === 0) return;
//     if (confirm('Delete selected entries?')) {
//       await db_module.deleteEntries(Array.from(selectedIds));
//       entries = await db_module.getAllEntries();
//       selectedIds.clear();
//       renderEntries();
//     }
//   });
//
//   exportSelectedButton.addEventListener('click', () => {
//     if (selectedIds.size === 0) return;
//     const selectedEntries = entries.filter(entry => selectedIds.has(entry.id));
//     const markdown = selectedEntries.map(entry => `- ${entry.content}\n`).join('');
//     console.log('Markdown:', markdown);
//     alert('Exported!\n\n' + markdown);
//   });
// }
//
// async function editEntry(id) {
//   const entry = entries.find(e => e.id === id);
//   const newContent = prompt('Edit entry:', entry.content);
//   if (newContent !== null && newContent !== entry.content) {
//     await db_module.updateEntry(id, newContent);
//     entry.content = newContent;
//     renderEntries();
//   }
// }
