// Clarity Tracking Script for B2Wall
// Automatically loads Microsoft Clarity on all pages

(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "tqiesaifez");

// Optional: Set user identifier if available in localStorage
window.addEventListener('DOMContentLoaded', function() {
    // Check for userId in URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('userId');
    
    if (userIdFromUrl) {
        localStorage.setItem('clarityUserId', userIdFromUrl);
    }
    
    const userId = localStorage.getItem('clarityUserId');
    
    if (userId && window.clarity) {
        clarity("set", "userId", userId);
        clarity("set", "userIdentifier", userId);
    }
    
    // Track page view
    console.log('✅ Clarity tracking active on:', window.location.pathname);
});
