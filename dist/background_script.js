function _get_current_tab() {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const currentTab = tabs[0];
    // Get all tabs in the current window to find the index
    browser.tabs.query({ currentWindow: true }).then((allTabs) => {
      const currentTabIndex = allTabs.findIndex(tab => tab.id === currentTab.id);
      sendResponse({ currentTabIndex });
    });
    return true; // Required for async sendResponse
  });


}



function _generateSettingsHTML(darkmode) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Settings</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        button { padding: 8px 16px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Settings</h1>
      <p>Dark mode: <span id="darkmode-state">${darkmode}</span></p>
      <button id="toggle-darkmode">Toggle Dark Mode</button>
      <script>
        document.getElementById('toggle-darkmode').addEventListener('click', () => {
          const newState = !(${darkmode});
          window.location.href = 'data:text/html,' + encodeURIComponent(
            generateSettingsHTML(newState)
          );
        });
      </script>
    </body>
    </html>
  `;
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSettingsTab') {
    const darkmode = true; // Fetch this from storage or state
    const html = _generateSettingsHTML(darkmode);
    browser.tabs.create({
      url: `data:text/html,${encodeURIComponent(html)}`,
      active: true
    });
  }


  if (message.action === 'openStorageTab') {
    console.debug('message: openStorageTab')
    console.debug('sender: ', sender);
    console.debug('sendResponse', sendResponse);
    browser.tabs.create({
      url: 'dist/template/storage.html',
      active: true // makes the new tab active
    });
  }
}
);
