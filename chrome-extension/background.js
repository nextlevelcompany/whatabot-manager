/* NextLead CRM - Chrome Extension Background Service Worker */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'API_CALL') {
    const { url, options } = request;
    
    fetch(url, options)
      .then(async (response) => {
        const text = await response.text();
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text;
        }
        sendResponse({ status: response.status, data: data });
      })
      .catch((error) => {
        console.error('Error fetching API in background:', error);
        sendResponse({ status: 500, error: error.message });
      });
      
    return true; // Keep the message channel open for sendResponse to be called asynchronously
  }
});
