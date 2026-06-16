// London House-Hunt bookmarklet — reference source.
// The draggable button on /import is the minified `javascript:` version of this, with the
// app's base URL substituted in. It reads the listing data already loaded in your browser
// (no extra request to the portal) and posts it to your local app.
(function () {
  var portal = null
  var data = null
  if (window.PAGE_MODEL) {
    portal = 'rightmove'
    data = window.PAGE_MODEL
  } else {
    var s = document.getElementById('__NEXT_DATA__')
    if (s) {
      portal = 'zoopla'
      try {
        data = JSON.parse(s.textContent)
      } catch (e) {
        /* ignore */
      }
    }
  }
  if (!data) {
    alert('No Rightmove/Zoopla listing data found on this page.')
    return
  }
  fetch('BASE/api/properties/import-bookmarklet', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ portal: portal, data: data, url: location.href }),
  })
    .then(function (r) {
      return r.json()
    })
    .then(function (j) {
      if (j && j.id) {
        if (confirm('Saved to House-Hunt. Open it?')) location.href = 'BASE/properties/' + j.id
      } else {
        alert('Import failed.')
      }
    })
    .catch(function () {
      alert('Could not reach the House-Hunt app — is it running?')
    })
})()
