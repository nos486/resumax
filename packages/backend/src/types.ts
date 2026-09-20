import { D1Database } from '@cloudflare/workers-types'
import { AuthUser } from '@resumax/shared'

export type Bindings = {
    DB: D1Database
    JWT_SECRET: string
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
    FRONTEND_URL: string
    COOKIE_DOMAIN?: string
}

export type Variables = {
    user: AuthUser
}
