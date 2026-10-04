const box = document.getElementById("on");
chrome.storage.sync.get({ enabled: true }, ({ enabled }) => (box.checked = enabled));
box.addEventListener("change", () => chrome.storage.sync.set({ enabled: box.checked }));
