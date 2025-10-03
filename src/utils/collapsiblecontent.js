document.addEventListener('DOMContentLoaded', () => {
    const mobileBreakpoint = 768;
    const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);
    
    const toggles = document.querySelectorAll('.toggle-header');

    function toggleContent(header) {
        const content = header.nextElementSibling;
        content.classList.toggle('hidden');
    }
    function handleFooterLayout(mediaQuery) {
        if (mediaQuery.matches) {
            toggles.forEach(header => {
                if (!header.hasAttribute('data-mobile-listener')) {
                    header.addEventListener('click', () => toggleContent(header));
                    header.setAttribute('data-mobile-listener', 'true');
                    if (!header.nextElementSibling.classList.contains('hidden')) {
                        header.nextElementSibling.classList.add('hidden');
                    }
                }
            });
        } else {
            toggles.forEach(header => {
                header.nextElementSibling.classList.remove('hidden');
            });
        }
    }

    handleFooterLayout(mediaQuery);

    mediaQuery.addEventListener('change', handleFooterLayout);
});