/**
 * Zod request validation middleware.
 *
 * Usage:
 *   router.post('/foo', validate({ body: FooBodySchema }), handler)
 *   router.get('/bar', validate({ query: BarQuerySchema }), handler)
 */

import { type Request, type Response, type NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

interface ValidationSchemas {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

/**
 * Express middleware that validates request body, query, and/or params against
 * Zod schemas.  On failure, responds with 400 and a structured error message.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Array<{ location: string; issues: string[] }> = []

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body)
      if (!result.success) {
        errors.push({
          location: 'body',
          issues: formatZodError(result.error),
        })
      } else {
        // Replace body with parsed (coerced/defaulted) values
        req.body = result.data
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query)
      if (!result.success) {
        errors.push({
          location: 'query',
          issues: formatZodError(result.error),
        })
      } else {
        ;(req as any).query = result.data
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params)
      if (!result.success) {
        errors.push({
          location: 'params',
          issues: formatZodError(result.error),
        })
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors,
      })
      return
    }

    next()
  }
}

function formatZodError(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') + ': ' : ''
    return `${path}${issue.message}`
  })
}
