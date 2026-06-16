import db from "./db_module"

const storage_module = (() => {

  function _make_window() {

    const storage_window = document.createElement('div');
    storage_window.id = 'popup-window';

    const title = document.createElement('h1');
    title.textContent = 'Storage Manager';
    storage_window.appendChild(title);

    const entries_container = document.createElement('div');
    storage_window.appendChild(entries_container);


    async function _make_entries() {
      entries_container.id = 'entries';
      const latest_articles = db.getArticlesLatest(20);
      for (const article of latest_articles) {
        console.log(article);
      }
    };

    function _make_controls() {
      const controls = document.createElement('div');
      controls.className = 'controls';

      const deleteBtn = document.createElement('button');
      deleteBtn.id = 'delete-selected';
      deleteBtn.textContent = 'Delete Selected';
      controls.appendChild(deleteBtn);

      const exportBtn = document.createElement('button');
      exportBtn.id = 'export-selected';
      exportBtn.textContent = 'Export Selected';
      controls.appendChild(exportBtn);

      const resetBtn = document.createElement('button');
      resetBtn.id = 'reset-selections';
      resetBtn.textContent = 'Reset Selections';
      controls.appendChild(resetBtn);

      storage_window.appendChild(controls);
    }

    _make_entries();
    _make_controls();
    //_make_filters();
    return storage_window;
  };


  function _gather_marked() {

  }

  function _delete_articles() {

  };


  function _make_filters() {
    // Filter section
    const filterSection = document.createElement('div');
    filterSection.className = 'filter-section';

    const textSearch = document.createElement('input');
    textSearch.type = 'text';
    textSearch.id = 'text-search';
    textSearch.placeholder = 'Search by text...';
    filterSection.appendChild(textSearch);

    const tagFilter = document.createElement('select');
    tagFilter.id = 'tag-filter';
    const allTagsOption = document.createElement('option');
    allTagsOption.value = '';
    allTagsOption.textContent = 'All Tags';
    tagFilter.appendChild(allTagsOption);
    filterSection.appendChild(tagFilter);

    const clearFiltersBtn = document.createElement('button');
    clearFiltersBtn.id = 'clear-filters';
    clearFiltersBtn.textContent = 'Clear Filters';
    filterSection.appendChild(clearFiltersBtn);

    storage_window.appendChild(filterSection);
  }

  // Select All checkbox
  function _make_selectall() {
    const selectAllContainer = document.createElement('div');
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'select-all';
    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = 'select-all';
    selectAllLabel.textContent = 'Select All';
    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);
    storage_window.appendChild(selectAllContainer);
  }

  // Prompt input textarea
  function _make_prompt_input() {
    const promptInput = document.createElement('textarea');
    promptInput.id = 'prompt-input';
    promptInput.placeholder = 'Enter your prompt here...';
    storage_window.appendChild(promptInput);
  }
  // };

  // Initialize the UI when the module is created
  // buildUI();

  return {
    getWindow() {
      const storage_window = _make_window();
      // return storage_window;
      return storage_window;
    },
  }
})();

export default storage_module;
