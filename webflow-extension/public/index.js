// Roolify Designer Extension - Mobile Responsive with Iframe
// This extension embeds the main app in an iframe with mobile menu
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const state = {
    iframe: null,
    sidebarOpen: false,
    currentPage: 'dashboard'
};
// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
    console.log('Roolify Extension loaded - initializing iframe and mobile menu');
    initializeIframe();
    setupMobileMenu();
    setupIframeCommunication();
    fetchUserInfo();
    setupUserDropdown();
    fetchAndSendCurrentSiteInfo();
});
function initializeIframe() {
    // Get the iframe
    state.iframe = document.getElementById('mainIframe');
    if (!state.iframe) {
        console.error('Main iframe not found');
        return;
    }
    // Hide loading spinner when iframe loads
    state.iframe.onload = () => {
        var _a, _b;
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
        // Send extension ready message to iframe
        (_b = (_a = state.iframe) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage({
            type: 'ROOLIFY_EXTENSION_READY',
            source: 'webflow-extension'
        }, 'http://localhost:3000');
        // Send current site info to iframe after it loads
        fetchAndSendCurrentSiteInfo();
        console.log('Iframe loaded successfully');
    };
    // Handle iframe load errors
    state.iframe.onerror = () => {
        console.error('Failed to load iframe');
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = '<div class="spinner"></div><div>Failed to load. Please check if the main app is running.</div>';
        }
    };
}
function setupMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeBtn = document.getElementById('closeBtn');
    const backdrop = document.getElementById('backdrop');
    const sidebar = document.getElementById('sidebar');
    const navItems = document.querySelectorAll('.nav-item');
    // Open sidebar
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            openSidebar();
        });
    }
    // Close sidebar
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeSidebar();
        });
    }
    // Close on backdrop click
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            closeSidebar();
        });
    }
    // Handle navigation
    navItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            if (page) {
                navigateToPage(page);
                closeSidebar();
            }
        });
    });
}
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    if (sidebar)
        sidebar.classList.add('open');
    if (backdrop)
        backdrop.classList.add('open');
    state.sidebarOpen = true;
    console.log('Sidebar opened');
}
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    if (sidebar)
        sidebar.classList.remove('open');
    if (backdrop)
        backdrop.classList.remove('open');
    state.sidebarOpen = false;
    console.log('Sidebar closed');
}
function navigateToPage(page) {
    console.log(`Navigating to page: ${page}`);
    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        }
    });
    // Update iframe URL
    if (state.iframe) {
        const baseUrl = 'http://localhost:3000';
        let url = `${baseUrl}/${page}`;
        // Map page names to routes
        const routes = {
            'dashboard': '/dashboard',
            'rule-builder': '/rule-builder',
            'notifications': '/notifications',
            'submissions': '/submissions',
            'setup': '/setup'
        };
        if (routes[page]) {
            url = `${baseUrl}${routes[page]}`;
        }
        state.iframe.src = url;
        state.currentPage = page;
        console.log(`Navigated iframe to: ${url}`);
    }
}
function fetchUserInfo() {
    // Fetch user info from the main app
    fetch('http://localhost:3000/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => response.json())
        .then(data => {
        if (data.authenticated) {
            // Try to get user data from the main app
            fetch('http://localhost:3000/api/user/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
                .then(response => response.json())
                .then(userData => {
                updateUserInfo(userData);
            })
                .catch(error => {
                console.log('Could not fetch user data, using default');
                updateUserInfo({ name: 'User', email: 'user@example.com' });
            });
        }
        else {
            console.log('User not authenticated');
            updateUserInfo({ name: 'Guest', email: 'guest@example.com' });
        }
    })
        .catch(error => {
        console.log('Auth check failed, using default user info');
        updateUserInfo({ name: 'User', email: 'user@example.com' });
    });
}
function updateUserInfo(userData) {
    const nameElement = document.querySelector('.user-name');
    const emailElement = document.querySelector('.user-email');
    const avatarElement = document.querySelector('.user-avatar');
    if (nameElement) {
        nameElement.textContent = userData.name || 'User';
    }
    if (emailElement) {
        emailElement.textContent = userData.email || 'user@example.com';
    }
    if (avatarElement) {
        const initial = (userData.name || userData.email || 'U')[0].toUpperCase();
        avatarElement.textContent = initial;
    }
    console.log('Updated user info:', userData);
}
function setupUserDropdown() {
    const dropdownBtn = document.querySelector('.user-dropdown-btn');
    const dropdownMenu = document.querySelector('.user-dropdown-menu');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    if (!dropdownBtn || !dropdownMenu) {
        console.log('User dropdown elements not found');
        return;
    }
    let isOpen = false;
    // Toggle dropdown on button click
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        if (isOpen) {
            dropdownMenu.style.display = 'block';
            // Add hover effects
            dropdownBtn.style.backgroundColor = '#f3f4f6';
        }
        else {
            dropdownMenu.style.display = 'none';
            dropdownBtn.style.backgroundColor = 'transparent';
        }
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (isOpen && !dropdownMenu.contains(e.target) && !dropdownBtn.contains(e.target)) {
            isOpen = false;
            dropdownMenu.style.display = 'none';
            dropdownBtn.style.backgroundColor = 'transparent';
        }
    });
    // Handle dropdown item clicks
    dropdownItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            var _a;
            e.preventDefault();
            const action = item.getAttribute('data-action');
            // Close dropdown
            isOpen = false;
            dropdownMenu.style.display = 'none';
            dropdownBtn.style.backgroundColor = 'transparent';
            // Handle actions
            switch (action) {
                case 'profile':
                    if (state.iframe) {
                        state.iframe.src = 'http://localhost:3000/profile';
                    }
                    break;
                case 'billing':
                    if (state.iframe) {
                        state.iframe.src = 'http://localhost:3000/plans';
                    }
                    break;
                case 'logout':
                    // Send logout message to iframe
                    if (state.iframe) {
                        (_a = state.iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage({
                            type: 'ROOLIFY_LOGOUT',
                            source: 'webflow-extension'
                        }, 'http://localhost:3000');
                    }
                    break;
            }
        });
        // Add hover effects
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f3f4f6';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
    });
    // Add hover effect to dropdown button
    dropdownBtn.addEventListener('mouseenter', () => {
        if (!isOpen) {
            dropdownBtn.style.backgroundColor = '#f3f4f6';
        }
    });
    dropdownBtn.addEventListener('mouseleave', () => {
        if (!isOpen) {
            dropdownBtn.style.backgroundColor = 'transparent';
        }
    });
}
function fetchAndSendCurrentSiteInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Fetching current site info from Webflow Designer...');
            // Get site info from Webflow Designer API
            const siteInfo = yield webflow.getSiteInfo();
            console.log('Site info received:', siteInfo);
            const siteData = {
                siteId: siteInfo.siteId,
                siteName: siteInfo.siteName || siteInfo.shortName || 'Current Site'
            };
            // Wait a moment for iframe to be ready
            setTimeout(() => {
                if (state.iframe && state.iframe.contentWindow) {
                    state.iframe.contentWindow.postMessage({
                        type: 'CURRENT_SITE_INFO',
                        payload: siteData,
                        source: 'webflow-extension'
                    }, 'http://localhost:3000');
                    console.log('Sent site info to iframe:', siteData);
                }
            }, 1000); // Wait 1 second for iframe to load
        }
        catch (error) {
            console.error('Failed to get site info from Webflow Designer:', error);
            console.warn('User will need to manually select site');
        }
    });
}
function setupIframeCommunication() {
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
        // Only accept messages from our app
        if (event.origin !== 'http://localhost:3000')
            return;
        console.log('Message from iframe:', event.data);
        // Handle different message types
        switch (event.data.type) {
            case 'ROOLIFY_NAVIGATE':
                // Navigate iframe to different page
                if (event.data.url && state.iframe) {
                    state.iframe.src = event.data.url;
                }
                break;
            case 'ROOLIFY_RESIZE':
                // Resize iframe if needed
                if (event.data.height && state.iframe) {
                    state.iframe.style.height = event.data.height + 'px';
                }
                break;
            case 'ROOLIFY_USER_UPDATE':
                // Update user info when it changes in the main app
                if (event.data.user) {
                    updateUserInfo(event.data.user);
                }
                else {
                    // User logged out
                    updateUserInfo({ name: 'Guest', email: 'guest@example.com' });
                }
                break;
            case 'ROOLIFY_REQUEST_SITE_INFO':
                // Iframe is requesting site info (after page navigation)
                fetchAndSendCurrentSiteInfo();
                break;
        }
    });
}
// Export functions for potential external use
window.RoolifyExtension = {
    state
};
