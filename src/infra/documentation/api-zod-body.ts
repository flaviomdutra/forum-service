import { applyDecorators } from '@nestjs/common'
import { ApiBody } from '@nestjs/swagger'
import { ZodArray, ZodObject, ZodRawShape, ZodString, ZodType } from 'zod'

type SwaggerSchema = {
  type: 'object'
  properties: Record<
    string,
    { type: string; items?: { type: string; format?: string } }
  >
  required: string[]
}

const createSwaggerSchemaFromZod = <T extends ZodRawShape>(
  schema: ZodObject<T>,
): SwaggerSchema => {
  const properties = schema.shape
  const swaggerSchema: SwaggerSchema = {
    type: 'object',
    properties: {},
    required: [],
  }

  for (const key in properties) {
    const prop = properties[key]
    const propSchema: {
      type: string
      items?: { type: string; format?: string }
    } = { type: 'object' }

    if (prop instanceof ZodArray) {
      propSchema.type = 'array'
      if (prop.element instanceof ZodString) {
        propSchema.items = { type: 'string' }
      }
    } else if (prop instanceof ZodType) {
      switch (prop._def.typeName) {
        case 'ZodString':
          propSchema.type = 'string'
          if (prop._def.checks.some((check) => check.kind === 'email')) {
            propSchema.items = { type: 'string', format: 'email' }
          }
          break
        case 'ZodNumber':
          propSchema.type = 'number'
          break
        case 'ZodBoolean':
          propSchema.type = 'boolean'
          break
      }
    }

    swaggerSchema.properties[key] = propSchema
    swaggerSchema.required.push(key)
  }

  return swaggerSchema
}

export function ApiZodBody<T extends ZodRawShape>(schema: ZodObject<T>) {
  return applyDecorators(
    ApiBody({
      schema: createSwaggerSchemaFromZod(schema),
    }),
  )
}
