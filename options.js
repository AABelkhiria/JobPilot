// Saves options to chrome.storage
function save_options() {
  const apiKey = document.getElementById('apiKey').value;
  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  //
  const profile = document.getElementById('profile').value;
  const experience = document.getElementById('experience').value;
  const skills = document.getElementById('skills').value;

  chrome.storage.sync.set({
    geminiApiKey: apiKey,
    //
    userInfo: { fullName, email, phone, address, profile, experience, skills }
  }, function() {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });
}

// Restores options from chrome.storage
function restore_options() {
  chrome.storage.sync.get(['geminiApiKey', 'userInfo'], function(items) {
    document.getElementById('apiKey').value = items.geminiApiKey || '';
    if (items.userInfo) {
      document.getElementById('fullName').value = items.userInfo.fullName || '';
      document.getElementById('email').value = items.userInfo.email || '';
      document.getElementById('phone').value = items.userInfo.phone || '';
      document.getElementById('address').value = items.userInfo.address || '';
      //
      document.getElementById('profile').value = items.userInfo.profile || '';
      document.getElementById('experience').value = items.userInfo.experience || '';
      document.getElementById('skills').value = items.userInfo.skills || '';
    }
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);