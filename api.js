/**
 * API layer - communicates with Google Apps Script backend
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
    showToast('URL tidak valid','error');
    return;
  }
  localStorage.setItem('gasUrl', url);
  GAS_URL = url;
  document.getElementById('screenConfig').style.display = 'none';
  showToast('Tersambung! Memuat data...','success');
  initApp();
}

async function apiGet(action, params) {
  var url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  if (params) {
    Object.keys(params).forEach(function(k) {
      if (params[k] !== undefined && params[k] !== null) {
        url.searchParams.set(k, params[k]);
      }
    });
  }
  var res = await fetch(url.toString(), { method: 'GET' });
  var data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function apiPost(action, body) {
  body = body || {};
  body.action = action;
  var res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  var data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ── Convenience wrappers ──
async function api(action, data, isGet) {
  try {
    return isGet ? await apiGet(action, data) : await apiPost(action, data);
  } catch(e) {
    console.error(action, e);
    throw e;
  }
}
