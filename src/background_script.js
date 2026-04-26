function _get_current_tab() {
  // TODO: what the heck is this code again? :D
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const currentTab = tabs[0];
    // Get all tabs in the current window to find the index
    browser.tabs.query({ currentWindow: true }).then((allTabs) => {
      const currentTabIndex = allTabs.findIndex(tab => tab.id === currentTab.id);
      sendResponse({ currentTabIndex });
    });
    return true;
  });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSettingsTab') {
    browser.tabs.create({
      url: browser.runtime.getURL('dist/template/settings-tab.html?ext=llm-notes'),
      active: true
    });
  }

  if (message.action === 'openStorageTab') {
    console.debug('message: openStorageTab')
    console.debug('sender: ', sender);
    console.debug('sendResponse', sendResponse);
    browser.tabs.create({
      url: browser.runtime.getURL('dist/template/storage-tab.html?ext=llm-notes'),
      active: true
    });
  }
}
);
