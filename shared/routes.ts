import { z } from 'zod';
import { cheatSheets } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  cheatSheets: {
    list: {
      method: 'GET' as const,
      path: '/api/cheatsheets' as const,
      responses: {
        200: z.array(z.custom<typeof cheatSheets.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/cheatsheets/:id' as const,
      responses: {
        200: z.custom<typeof cheatSheets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/upload' as const,
      responses: {
        201: z.object({
          id: z.number(),
          url: z.string().nullable(),
          filename: z.string().nullable(),
        }),
        400: errorSchemas.validation,
      },
    },
    uploadText: {
      method: 'POST' as const,
      path: '/api/upload-text' as const,
      responses: {
        201: z.object({
          id: z.number(),
          url: z.string().nullable(),
          filename: z.string().nullable(),
        }),
        400: errorSchemas.validation,
      },
    },
    process: {
      method: 'POST' as const,
      path: '/api/cheatsheets/:id/process' as const,
      responses: {
        200: z.custom<typeof cheatSheets.$inferSelect>(),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/cheatsheets/:id' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CheatSheetResponse = z.infer<typeof api.cheatSheets.get.responses[200]>;
