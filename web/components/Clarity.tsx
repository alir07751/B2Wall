'use client';

import Script from 'next/script';

const CLARITY_ID = 'tqiesaifez';

export function Clarity() {
  return (
    <Script
      id="clarity-b2wall"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_ID}");
window.addEventListener('load', function setClarityCustoms() {
  if (typeof window.clarity !== 'function') return;
  var urlParams = new URLSearchParams(window.location.search);
  var userParam = urlParams.get('user');
  if (userParam) localStorage.setItem('b2wall_user_identifier', userParam);
  var userIdFromUrl = urlParams.get('userId');
  if (userIdFromUrl) localStorage.setItem('clarityUserId', userIdFromUrl);
  var userIdentifier = userParam || localStorage.getItem('b2wall_user_identifier') || localStorage.getItem('clarityUserId') || 'anonymous_user';
  window.clarity('set', 'userIdentifier', userIdentifier);
  window.clarity('set', 'userId', userIdentifier);
  ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(key) {
    var value = urlParams.get(key);
    if (value) { localStorage.setItem('b2wall_utm_' + key, value); window.clarity('set', key, value); }
  });
});
`,
      }}
    />
  );
}
