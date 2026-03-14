/**
 * Simple client-side router for current Jumo app
 */
class Router {
    constructor(pages, mainElement) {
        this.pages = pages;
        this.mainElement = mainElement;
        this.navLinks = document.querySelectorAll('.nav-link');
        this.currentPage = null;
        
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

        const initialPage = window.location.hash.replace('#', '') || 'home';
        this.navigate(initialPage);
    }

    navigate(pageId) {
        if (!this.pages[pageId]) {
            pageId = 'home';
        }

        window.location.hash = pageId;

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
            if (this.currentPage?.destroy) {
                this.currentPage.destroy();
            }

            const page = new PageClass();
            this.currentPage = page;
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
