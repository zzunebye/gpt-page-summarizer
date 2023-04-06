// chromeApi.js

export const getActiveTab = (callback: any) => {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    (tab: chrome.tabs.Tab[]) => {
      callback(tab);
    }
  );
};

// export const getValueFromStorage = (key: string, callback: any) => {
//   chrome.storage.sync.get("apiKey", (data) => {
//     callback(data.apiKey);
//   });
// };

export const getValueFromStorage = (key: string, callback: any) => {
  // Retrieve the API key from Chrome storage
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.get(key, (result) => {
      if (result[key]) {
        callback(result[key]);
      }
    });
    // chrome.storage.sync.get(key, (data) => {
    //   if (data.apiKey) {
    //     callback(data.apiKey);
    //   }
    // });
  }
};

// Add other required methods
