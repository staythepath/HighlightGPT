document.addEventListener('DOMContentLoaded', () => {
    const apiKeyForm = document.getElementById('apiKeyForm');
    const apiKeyInput = document.getElementById('apiKey');
    const customPromptForm = document.getElementById('customPromptForm');
    const customPromptInput = document.getElementById('customPrompt');
  
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
  
    // Save the custom prompt to chrome.storage when the form is submitted
    customPromptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      chrome.storage.sync.set({ customPrompt: customPromptInput.value }, () => {
        if (chrome.runtime.lastError) {
          alert('Failed to save custom prompt. Error message: ' + chrome.runtime.lastError.message);
        } else {
          alert('Custom prompt saved successfully.');
        }
      });
    });
  
    // Load the API key and custom prompt from chrome.storage and set them as the input values
    chrome.storage.sync.get(['apiKey', 'customPrompt'], (data) => {
      if (data.apiKey) {
        apiKeyInput.value = data.apiKey;
        console.log("Retrieved API key:", data.apiKey);
      } else {
        console.log("No API key found.");
      }
  
      if (data.customPrompt) {
        customPromptInput.value = data.customPrompt;
        console.log("Retrieved custom prompt:", data.customPrompt);
      } else {
        console.log("No custom prompt found.");
      }
    });
  
  });
  