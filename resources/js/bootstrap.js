import axios from 'axios';

// Configure axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true;

// Get CSRF token from meta tag and set it
const updateCsrfToken = () => {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
        return token.content;
    }
    return null;
};

// Set CSRF token immediately
updateCsrfToken();

// Add request interceptor to ensure CSRF token is always set
axios.interceptors.request.use(
    (config) => {
        // Update CSRF token before each request
        const token = updateCsrfToken();
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle CSRF token mismatches
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // If we get a 419 error (CSRF token mismatch), try to update token and retry
        if (error.response?.status === 419) {
            console.warn('CSRF token mismatch, updating token...');
            updateCsrfToken();
            
            // Retry the request with updated token
            if (error.config && !error.config._retry) {
                error.config._retry = true;
                const token = updateCsrfToken();
                if (token) {
                    error.config.headers['X-CSRF-TOKEN'] = token;
                }
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
