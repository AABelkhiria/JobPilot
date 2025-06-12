// Saves options to chrome.storage
function save_options() {
  const apiKey = document.getElementById('apiKey').value;
  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const experience = document.getElementById('experience').value;

  chrome.storage.sync.set({
    geminiApiKey: apiKey,
    userInfo: { fullName, email, phone, address, experience }
  }, function() {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get(['geminiApiKey', 'userInfo'], function(items) {
    document.getElementById('apiKey').value = items.geminiApiKey || '';
    if (items.userInfo) {
      document.getElementById('fullName').value = items.userInfo.fullName || '';
      document.getElementById('email').value = items.userInfo.email || '';
      document.getElementById('phone').value = items.userInfo.phone || '';
      document.getElementById('address').value = items.userInfo.address || '';
      document.getElementById('experience').value = items.userInfo.experience || '';
    }
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);