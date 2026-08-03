/**
 * API layer - JSONP to bypass CORS with Google Apps Script
 */

var GAS_URL = '';

function initAPI() {
  GAS_URL = localStorage.getItem('gasUrl') || '';
  if (!GAS_URL) {
    document.getElementById('screenConfig').style.display = 'flex';
    return false;
  }
  return true;
}

function saveConfig() {
  var url = document.getElementById('gasUrl').value.trim();
  if (!url || !url.includes('script.google.com')) {
    showToast('URL tidak valid', 'error');
    return;
  }
  localStorage.setItem('gasUrl', url);
  GAS_URL = url;
  document.getElementById('screenConfig').style.display = 'none';
  showToast('Tersambung! Memuat data...', 'success');
  initApp();
}

/**
 * JSONP request - bypasses CORS completely
 * All data (including mutations) sent as GET params
 */
function api(action, data) {
  return new Promise(function(resolve, reject) {
    var cbName = '_cb' + Date.now() + Math.random().toString(36).substr(2, 5);
    var script = document.createElement('script');
    var url = new URL(GAS_URL);

    url.searchParams.set('action', action);
    url.searchParams.set('callback', cbName);

    // All data encoded as JSON string in 'data' param
    if (data && Object.keys(data).length > 0) {
      url.searchParams.set('data', JSON.stringify(data));
    }

    var timeout = setTimeout(function() {
      cleanup();
      reject(new Error('Request timeout. Coba lagi.'));
    }, 30000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cbName] = function(result) {
      cleanup();
      if (result && result.error) reject(new Error(result.error));
      else resolve(result);
    };

    script.onerror = function() {
      cleanup();
      reject(new Error('Gagal terhubung ke server. Periksa URL GAS.'));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

