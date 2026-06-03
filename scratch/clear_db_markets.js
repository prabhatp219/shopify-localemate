import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all market data from the database...");
  
  const deletedTranslations = await prisma.translation.deleteMany({});
  console.log(`Deleted ${deletedTranslations.count} translations.`);

  const deletedAnalytics = await prisma.analytics.deleteMany({});
  console.log(`Deleted ${deletedAnalytics.count} analytics records.`);

  const deletedMarketCampaigns = await prisma.marketCampaign.deleteMany({});
  console.log(`Deleted ${deletedMarketCampaigns.count} market campaigns.`);

  const deletedMarkets = await prisma.market.deleteMany({});
  console.log(`Deleted ${deletedMarkets.count} markets.`);

  console.log("✅ Database cleared successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
