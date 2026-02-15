import { D1Database } from '@cloudflare/workers-types'

export type Bindings = {
    DB: D1Database
    JWT_SECRET: string
}

export type Variables = {
    user: {
        id: number
        email: string
    }
}
