const storage_module = (() => {
  const storage_window = document.createElement('div');
  storage_window.id = 'storage-window';

  return {
    getWindow() {
      return storage_window;
    },
  }
})();

export default storage_module;
