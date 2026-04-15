const tabulator = (() => {
	let id = undefined;
	let settingsTab = undefined;

	return {
		openSettingsTab() {
			settingsTab = browser.tabs.create();
		},
	}

}); 
