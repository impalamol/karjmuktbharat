// Sets the theme class before React renders, so there is no light/dark flash.
// External file because the CSP forbids inline scripts.
;(function () {
  var theme = 'dark'
  try {
    var saved = JSON.parse(localStorage.getItem('kmb-ui') || '{}')
    if (saved.state && (saved.state.theme === 'light' || saved.state.theme === 'dark')) theme = saved.state.theme
  } catch (e) {}
  if (theme === 'dark') document.documentElement.classList.add('dark')
})()
