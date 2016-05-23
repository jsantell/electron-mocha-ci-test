window.$ = (selector, scope) => (scope || document).querySelector(selector);
window.$$ = (selector, scope) => (scope || document).querySelectorAll(selector);
