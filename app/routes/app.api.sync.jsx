/**
 * Resource route for syncing Shopify data into Market records
 * No default export — this is an API-only route
 *
 * POST — Trigger a full sync of orders, translations, and scores
 */

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

import {
  fetchRecentOrders,
  fetchShopifyMarkets,
  fetchTranslatableProducts,
} from "../services/shopifyApi.server";

import {
  calculateConversionRate,
  calculateLocalizationScore,
} from "../services/scoring";

/**
 * Builds a JSON Response with proper headers
 */
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Groups Shopify orders by country
 */
function groupOrdersByCountry(orders) {
  const grouped = {};

  for (const order of orders) {
    const countryCode = order.billingAddress?.countryCode;

    if (!countryCode) continue;

    if (!grouped[countryCode]) {
      grouped[countryCode] = {
        count: 0,
        revenue: 0,
      };
    }

    grouped[countryCode].count += 1;

    const amount = parseFloat(
      order.totalPriceSet?.shopMoney?.amount || "0"
    );

    grouped[countryCode].revenue += amount;
  }

  return grouped;
}

/**
 * Sync Action
 */
export async function action({ request }) {
  if (request.method.toUpperCase() !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Only POST method is allowed",
      },
      405
    );
  }

  try {
    const formData = await request.formData();
    const days = Number(formData.get("days")) || 30;

    console.log("Syncing analytics for:", days, "days");

    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    // 1. Fetch Shopify data
    const [
      orders,
      shopifyMarkets,
      translatableProducts,
    ] = await Promise.all([
      fetchRecentOrders(admin, 250), // Fetch up to 250 recent orders
      fetchShopifyMarkets(admin),
      fetchTranslatableProducts(admin, 100),
    ]);

    const totalProducts = translatableProducts.length || 1;

    // 2. Filter orders by date for the requested timeframe (days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= cutoffDate;
    });

    const ordersByCountry = groupOrdersByCountry(filteredOrders);

    // 3. Fetch markets from DB
    const markets = await prisma.market.findMany({
      where: { shop },
      include: {
        translations: true,
        campaigns: {
          where: { status: "active" },
        },
      },
    });

    // 4. Map enabled locales/currencies
    const enabledLocales = new Set();
    const enabledCurrencies = new Set();

    for (const market of shopifyMarkets) {
      if (market.webPresence?.defaultLocale?.locale) {
        enabledLocales.add(market.webPresence.defaultLocale.locale);
      }
      if (market.webPresence?.alternateLocales) {
        for (const alt of market.webPresence.alternateLocales) {
          if (alt.published) {
            enabledLocales.add(alt.locale);
          }
        }
      }
      if (market.currencySettings?.baseCurrency?.currencyCode) {
        enabledCurrencies.add(market.currencySettings.baseCurrency.currencyCode);
      }
    }

    // 5. Update markets in DB with actual metrics
    const updatedMarkets = [];

    for (const market of markets) {
      const countryData = ordersByCountry[market.countryCode] || {
        count: 0,
        revenue: 0,
      };

      const translationCount = market.translations.length;

      // Real statistics from filtered orders
      const realOrders = countryData.count;
      const realRevenue = countryData.revenue;

      // Estimate visitors based on a standard 3% conversion rate, or 0 if no orders
      const realVisitors = realOrders > 0 ? Math.ceil(realOrders / 0.03) : 0;
      const conversionRate = realOrders > 0 ? 3.0 : 0.0;

      const localizationScore = calculateLocalizationScore({
        translatedItems: translationCount,
        totalProducts,
        hasCurrency: enabledCurrencies.has(market.currency),
        hasLanguage: enabledLocales.has(market.language),
        activeCampaigns: market.campaigns.length,
        conversionRate,
      });

      const trend = 0.0;

      const updated = await prisma.market.update({
        where: { id: market.id },
        data: {
          visitors: realVisitors,
          orders: realOrders,
          revenue: realRevenue,
          conversionRate,
          localizationScore,
          translatedItems: translationCount,
          trend,
        },
      });

      updatedMarkets.push(updated);
    }

    return jsonResponse({
      success: true,
      synced: updatedMarkets.length,
      days,
      markets: updatedMarkets,
      meta: {
        totalOrders: orders.length,
        totalProducts,
        countriesWithOrders: Object.keys(ordersByCountry).length,
        enabledLocales: Array.from(enabledLocales),
        enabledCurrencies: Array.from(enabledCurrencies),
      },
    });
  } catch (error) {
    console.error("[app.api.sync] Action error:", error);
    return jsonResponse(
      {
        success: false,
        error: "Sync failed: " + error.message,
      },
      500
    );
  }
}