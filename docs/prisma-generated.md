# Prisma generated client

The Prisma client is generated into `lib/generated/prisma` because this project uses
Prisma's `prisma-client` generator with an explicit TypeScript output path.

The generated files are committed so deployments and code review see the same client
surface that local development uses. If the project later switches back to the
default `@prisma/client` package output, remove `lib/generated/prisma` from source
control and generate the client during install/build instead.
