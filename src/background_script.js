let settings_tab;
let storage_tab;
let sidebar_tab;

async function init_sidebar_tab() {
  const tabs = await browser.tabs.query({ url: "https://chat.mistral.ai/*" });
  if (tabs.length > 0) {
    sidebar_tab = tabs[0];
  } else {
    console.error('No sidebar tab found!');
  }
}
init_sidebar_tab();

// function _get_current_tab() {
//   // TODO: what the heck is this code again? :D
//   browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
//     const currentTab = tabs[0];
//     // Get all tabs in the current window to find the index
//     browser.tabs.query({ currentWindow: true }).then((allTabs) => {
//       const currentTabIndex = allTabs.findIndex(tab => tab.id === currentTab.id);
//       sendResponse({ currentTabIndex });
//     });
//     return true;
//   });
// }

// function _handle_storage_tab_message(message, sendResponse) {
//   if (message.type === 'GET_ALL_ARTICLES') {
//     console.debug('background script received a message: ', message);
//     console.debug('sender was storage_tab');
//     browser.tabs.sendMessage(sidebar_tab.id, {
//       type: 'GET_ALL_ARTICLES'
//     },
//       (response) => {
//         if (browser.runtime.lastError) {
//           console.error('background_script Error:', browser.runtime.lastError);
//         } else {
//           console.log('background_script received response:', response);
//           sendResponse(response);
//         }
//       });
//     return true;
//   }
// }

async function _handle_sidebar_message(message, sendResponse) {
  if (message.action === 'openSettingsTab') {
    settings_tab = await browser.tabs.create({
      url: browser.runtime.getURL('dist/template/settings-tab.html?ext=llm-notes'),
      active: true
    });
  } else if (message.action === 'openStorageTab') {
    storage_tab = await browser.tabs.create({
      url: browser.runtime.getURL('dist/template/storage-tab.html?ext=llm-notes'),
      active: true
    });
  }
}


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.tab.id === sidebar_tab.id) {
    _handle_sidebar_message(message, sendResponse);
  } else if (sender.tab.id === storage_tab.id) {
    //_handle_storage_tab_message(message, sendResponse);
  }
});
