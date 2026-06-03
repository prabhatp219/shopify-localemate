import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const suggestions = await prisma.suggestion.findMany();
  console.log('--- ALL SUGGESTIONS ---');
  console.log(JSON.stringify(suggestions, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
