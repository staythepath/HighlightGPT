document.addEventListener('DOMContentLoaded', () => {
    const apiKeyForm = document.getElementById('apiKeyForm');
    const apiKeyInput = document.getElementById('apiKey');
    console.log(apiKeyInput.value);
  
    // Save the API key to chrome.storage when the form is submitted
    apiKeyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      chrome.storage.sync.set({ apiKey: apiKeyInput.value }, () => {
        if (chrome.runtime.lastError) {
          alert('Failed to save API key. Error message: ' + chrome.runtime.lastError.message);
        } else {
          alert('API key saved successfully.');
        }
      });
    });
  
    // Load the API key from chrome.storage and set it as the input value
    chrome.storage.sync.get('apiKey', (data) => {
      if (data.apiKey) {
        apiKeyInput.value = data.apiKey;
        console.log("Retrieved API key:", data.apiKey);
      } else {
        console.log("No API key found.");
      }
    });
  
  }); // <-- Added closing parenthesis and semicolon to close the DOMContentLoaded event handler
  