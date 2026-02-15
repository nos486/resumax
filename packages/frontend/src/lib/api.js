const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'
console.log('API URL:', API_URL)


export async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token')
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
    }

    return data
}

export const api = {
    login: (email, password) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }),
    register: (email, password) => request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }),
    getResume: () => request('/resume'),
    updateResume: (data) => request('/resume', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    getPublicResume: (slug) => request(`/public/${slug}`),
}
