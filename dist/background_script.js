var LLMNotesBackground = (() => {
  // src/background_script.js
  var settings_tab;
  var storage_tab;
  var sidebar_tab;
  async function init_sidebar_tab() {
    const tabs = await browser.tabs.query({ url: "https://chat.mistral.ai/*" });
    if (tabs.length > 0) {
      sidebar_tab = tabs[0];
    } else {
      console.error("No sidebar tab found!");
    }
  }
  init_sidebar_tab();
  async function _handle_sidebar_message(message, sendResponse) {
    if (message.action === "openSettingsTab") {
      settings_tab = await browser.tabs.create({
        url: browser.runtime.getURL("dist/template/settings-tab.html?ext=llm-notes"),
        active: true
      });
    } else if (message.action === "openStorageTab") {
      storage_tab = await browser.tabs.create({
        url: browser.runtime.getURL("dist/template/storage-tab.html?ext=llm-notes"),
        active: true
      });
    }
  }
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.tab.id === sidebar_tab.id) {
      _handle_sidebar_message(message, sendResponse);
    } else if (sender.tab.id === storage_tab.id) {
    }
  });
})();
