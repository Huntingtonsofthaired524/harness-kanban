import { prisma } from '@repo/database'

export default async function globalTeardown() {
  console.log('Global teardown: Starting...')

  // Drop all tables in the database
  await prisma.$executeRaw`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `
  console.log('Global teardown: Done')
}

// Run if executed directly (not imported as a module)
const isMainModule = process.argv[1]?.includes('teardown.ts')
if (isMainModule) {
  globalTeardown()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}
