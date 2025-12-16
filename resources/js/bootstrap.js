import axios from 'axios';

// Configure axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true;

// Get CSRF token from meta tag and set it
const getCsrfToken = () => {
    // Try multiple methods to get CSRF token
    let token = null;
    
    // Method 1: From meta tag (most reliable)
    const metaTag = document.head.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        token = metaTag.getAttribute('content');
        if (token) return token;
    }
    
    // Method 2: From Inertia page props (if available)
    try {
        if (window.Inertia && window.Inertia.page && window.Inertia.page.props && window.Inertia.page.props.csrf_token) {
            token = window.Inertia.page.props.csrf_token;
            if (token) return token;
        }
    } catch (e) {
        // Ignore errors
    }
    
    // Method 3: From cookie (Laravel stores it in XSRF-TOKEN cookie)
    if (document.cookie) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN' && value) {
                token = decodeURIComponent(value);
                if (token) return token;
            }
        }
    }
    
    // Method 4: From window.Laravel (if set in blade template)
    if (!token && window.Laravel && window.Laravel.csrfToken) {
        token = window.Laravel.csrfToken;
    }
    
    return token;
};

// Update CSRF token function
const updateCsrfToken = () => {
    const token = getCsrfToken();
    if (token) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        axios.defaults.headers.common['X-XSRF-TOKEN'] = token;
    }
    return token;
};

// Set CSRF token immediately
updateCsrfToken();

// Periodically refresh CSRF token to prevent expiration (every 5 minutes)
setInterval(() => {
    updateCsrfToken();
}, 5 * 60 * 1000); // 5 minutes

// Add request interceptor to ensure CSRF token is always fresh before each request
axios.interceptors.request.use(
    (config) => {
        // Always get fresh token before each request
        const token = getCsrfToken();
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
            config.headers['X-XSRF-TOKEN'] = token;
        }
        
        // Ensure credentials are sent
        config.withCredentials = true;
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle CSRF token mismatches
axios.interceptors.response.use(
    (response) => {
        // Update token from response headers if available
        const newToken = response.headers['x-csrf-token'] || response.headers['x-xsrf-token'];
        if (newToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
            axios.defaults.headers.common['X-XSRF-TOKEN'] = newToken;
        }
        return response;
    },
    async (error) => {
        // If we get a 419 error (CSRF token mismatch), refresh token and retry
        if (error.response?.status === 419) {
            console.warn('CSRF token mismatch detected, refreshing token...');
            
            // Try to get fresh token from server (GET requests don't need CSRF)
            try {
                // Create a fresh axios instance without interceptors to avoid loops
                const tokenAxios = axios.create({
                    withCredentials: true,
                });
                const tokenResponse = await tokenAxios.get('/api/csrf-token');
                if (tokenResponse.data.success && tokenResponse.data.csrf_token) {
                    // Update meta tag
                    const metaTag = document.head.querySelector('meta[name="csrf-token"]');
                    if (metaTag) {
                        metaTag.setAttribute('content', tokenResponse.data.csrf_token);
                    }
                    // Update defaults
                    axios.defaults.headers.common['X-CSRF-TOKEN'] = tokenResponse.data.csrf_token;
                    axios.defaults.headers.common['X-XSRF-TOKEN'] = tokenResponse.data.csrf_token;
                }
            } catch (tokenError) {
                console.error('Failed to refresh CSRF token:', tokenError);
                // Fallback: try to get token from current page
                updateCsrfToken();
            }
            
            // Retry the request with updated token (only once)
            if (error.config && !error.config._retry && !error.config.skipAuthRefresh) {
                error.config._retry = true;
                
                const newToken = getCsrfToken();
                if (newToken) {
                    error.config.headers['X-CSRF-TOKEN'] = newToken;
                    error.config.headers['X-XSRF-TOKEN'] = newToken;
                }
                
                // Small delay before retry
                await new Promise(resolve => setTimeout(resolve, 100));
                
                return axios.request(error.config);
            }
        }
        return Promise.reject(error);
    }
);

// Also set on window for backward compatibility
window.axios = axios;

// Export configured axios instance
export default axios;
