var LLMNotesBackground=(()=>{function o(e){return`
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
      <p>Dark mode: <span id="darkmode-state">${e}</span></p>
      <button id="toggle-darkmode">Toggle Dark Mode</button>
      <script>
        document.getElementById('toggle-darkmode').addEventListener('click', () => {
          const newState = !(${e});
          window.location.href = 'data:text/html,' + encodeURIComponent(
            generateSettingsHTML(newState)
          );
        });
      <\/script>
    </body>
    </html>
  `}browser.runtime.onMessage.addListener((e,t,n)=>{if(e.action==="openSettingsTab"){let r=o(!0);browser.tabs.create({url:`data:text/html,${encodeURIComponent(r)}`,active:!0})}e.action==="openStorageTab"&&(console.debug("message: openStorageTab"),console.debug("sender: ",t),console.debug("sendResponse",n),browser.tabs.create({url:browser.runtime.getURL("dist/template/storage-tab.html?ext=llm-notes"),active:!0}))});})();
