export const MIDDLEWARE_URL =
    process.env.REACT_APP_MIDDLEWARE_URL ??
    (process.env.NODE_ENV === 'production' ? 'https://middleware.cffe.cep.swiss' : 'http://localhost:4000')

export const authCookiesMaxAgeSeconds = { true: 1800, false: 10 }
