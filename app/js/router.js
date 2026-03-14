/**
 * Simple client-side router for current Jumo app
 */
class Router {
    constructor(pages, mainElement) {
        this.pages = pages;
        this.mainElement = mainElement;
        this.navLinks = document.querySelectorAll('.nav-link');
        
        this.init();
    }

    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                this.navigate(pageId);
            });
        });

        // Initial navigation
        const initialPage = 'home';
        this.navigate(initialPage);
    }

    navigate(pageId) {
        // Update URL hash (optional for extension, but useful)
        // window.location.hash = pageId;

        // Update nav links
        this.navLinks.forEach(link => {
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Render page
        const PageClass = this.pages[pageId];
        if (PageClass) {
            const page = new PageClass();
            this.mainElement.innerHTML = '';
            
            const pageElement = document.createElement('div');
            pageElement.className = `page active page-enter ${pageId}-page`;
            pageElement.innerHTML = page.render();
            
            this.mainElement.appendChild(pageElement);
            
            // Call post-render hook
            if (page.afterRender) {
                page.afterRender(pageElement);
            }
        }
    }
}

window.Router = Router;
