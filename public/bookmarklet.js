// London House-Hunt bookmarklet — reference source.
// The draggable button on /import is the minified `javascript:` version of this, with the
// app's base URL substituted in. It reads the listing data already loaded in your browser
// (no extra request to the portal) and saves it here.
(function () {
  var portal = null
  var data = null
  if (window.PAGE_MODEL) {
    portal = 'rightmove'
    data = window.PAGE_MODEL
  } else {
    var targeting = document.getElementById('__ZAD_TARGETING__')
    if (targeting) {
      portal = 'zoopla'
      var t = null
      var j = null
      try {
        t = JSON.parse(targeting.textContent)
      } catch (e) {
        /* ignore */
      }
      var ldScripts = document.querySelectorAll('script[type="application/ld+json"]')
      for (var i = 0; i < ldScripts.length; i++) {
        try {
          var ld = JSON.parse(ldScripts[i].textContent)
          if (ld && ld['@type'] === 'RealEstateListing') {
            j = ld
            break
          }
        } catch (e) {
          /* ignore */
        }
      }
      data = { targeting: t, jsonLd: j }
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
