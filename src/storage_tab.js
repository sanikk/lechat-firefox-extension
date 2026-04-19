import * as db_module from './db_module.js';

// DOM Elements
const entriesContainer = document.getElementById('entries');
const deleteSelectedButton = document.getElementById('delete-selected');
const exportSelectedButton = document.getElementById('export-selected');
const selectAllCheckbox = document.getElementById('select-all');

// State
let entries = [];
let selectedIds = new Set();

// --- Main ---
async function init() {
  entries = await db_module.getAllEntries();
  renderEntries();
  setupEventListeners();
}

init();

// --- Render ---
function renderEntries() {
  entriesContainer.innerHTML = '';
  for (const entry of entries) {
    const entryElement = document.createElement('div');
    entryElement.className = 'entry';
    entryElement.innerHTML = `
      <div>
        <input
          type="checkbox"
          class="entry-checkbox"
          data-id="${entry.id}"
          ${selectedIds.has(entry.id) ? 'checked' : ''}
        >
        <span class="entry-content" data-id="${entry.id}">${entry.content}</span>
        <button class="edit-button" data-id="${entry.id}">Edit</button>
      </div>
    `;
    entriesContainer.appendChild(entryElement);
  }
}

// --- Event Listeners ---
function setupEventListeners() {
  // Select all
  selectAllCheckbox.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.entry-checkbox');
    for (const checkbox of checkboxes) {
      checkbox.checked = e.target.checked;
      const id = parseInt(checkbox.getAttribute('data-id'));
      if (e.target.checked) selectedIds.add(id);
      else selectedIds.delete(id);
    }
  });

  // Entry checkboxes
  entriesContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('entry-checkbox')) {
      const id = parseInt(e.target.getAttribute('data-id'));
      if (e.target.checked) selectedIds.add(id);
      else selectedIds.delete(id);
    }
  });

  // Edit buttons
  entriesContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-button')) {
      const id = parseInt(e.target.getAttribute('data-id'));
      await editEntry(id);
    }
  });

  // Delete selected
  deleteSelectedButton.addEventListener('click', async () => {
    if (selectedIds.size === 0) return;
    if (confirm('Delete selected entries?')) {
      await db_module.deleteEntries(Array.from(selectedIds));
      entries = await db_module.getAllEntries();
      selectedIds.clear();
      renderEntries();
    }
  });

  // Export selected
  exportSelectedButton.addEventListener('click', () => {
    if (selectedIds.size === 0) return;
    const selectedEntries = entries.filter(entry => selectedIds.has(entry.id));
    const markdown = selectedEntries.map(entry => `- ${entry.content}\n`).join('');
    console.log('Markdown:', markdown);
    alert('Exported!\n\n' + markdown);
  });
}

// --- Edit Entry ---
async function editEntry(id) {
  const entry = entries.find(e => e.id === id);
  const newContent = prompt('Edit entry:', entry.content);
  if (newContent !== null && newContent !== entry.content) {
    await db_module.updateEntry(id, newContent);
    entry.content = newContent;
    renderEntries();
  }
}
