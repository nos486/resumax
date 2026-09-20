/**
 * OpenAPI 3.0 Specification for Resumax Edge API
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Resumax API',
    version: '1.0.0',
    description: 'High-performance edge API for the Resumax resume & CV builder platform.',
  },
  servers: [
    {
      url: '/api',
      description: 'Current environment API base',
    },
  ],
  paths: {
    '/auth/google': {
      get: {
        summary: 'Initiate Google OAuth flow',
        description: 'Redirects the client to Google OAuth 2.0 consent dialog.',
        responses: {
          '302': { description: 'Redirect to Google consent screen' },
        },
      },
    },
    '/auth/google/callback': {
      get: {
        summary: 'Handle Google OAuth callback',
        description: 'Exchanges auth code for user tokens, links/creates user in D1, sets httpOnly session cookies, and redirects to frontend.',
        parameters: [
          { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '302': { description: 'Redirect to frontend /auth/callback with session cookies' },
          '400': { description: 'OAuth exchange failure' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate session tokens',
        description: 'Validates rotating refresh token from httpOnly cookie and issues fresh access and refresh cookies.',
        responses: {
          '200': {
            description: 'Refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        email: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout current session',
        description: 'Revokes refresh token in D1 and deletes session cookies.',
        responses: {
          '200': { description: 'Successfully logged out' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: { id: { type: 'number' }, email: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/resume': {
      get: {
        summary: 'Retrieve user resume',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: 'User resume data' },
          '401': { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Save user resume',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content', 'theme'],
                properties: {
                  slug: { type: 'string', minLength: 3, maxLength: 50 },
                  theme: { type: 'string', default: 'modern' },
                  content: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Resume saved successfully' },
          '400': { description: 'Validation error' },
          '409': { description: 'Slug collision' },
        },
      },
    },
    '/public/{slug}': {
      get: {
        summary: 'Public resume view',
        description: 'Public endpoint with rate limiting (60 req/min/ip) and XSS URL sanitization.',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Sanitized public resume content' },
          '404': { description: 'Resume not found' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/admin/users': {
      get: {
        summary: 'List users with resume status (Admin only)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } },
        ],
        responses: {
          '200': { description: 'Paginated user list' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden: Admin access required' },
        },
      },
    },
    '/admin/users/{id}': {
      get: {
        summary: 'Get user detail with full resume (Admin only)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'User detail and resume content' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden: Admin access required' },
          '404': { description: 'User not found' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'resumax_access',
      },
    },
  },
}
