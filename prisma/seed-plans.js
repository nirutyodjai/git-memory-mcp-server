const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding subscription plans...');

  try {
    // Create Free Plan
    const freePlan = await prisma.plan.upsert({
      where: { name: 'Free' },
      update: {},
      create: {
        name: 'Free',
        displayName: 'Free Plan',
        description: 'Perfect for getting started with Git Memory MCP Server',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: {
          api_calls: 1000,
          storage_mb: 100,
          servers_count: 1,
          support_level: 'community',
          custom_domains: false,
          advanced_analytics: false,
          priority_support: false,
          sla_guarantee: false
        },
        limits: {
          api_calls: 1000,
          storage_mb: 100,
          servers_count: 1,
          rate_limit_per_minute: 60,
          concurrent_connections: 10
        },
        isActive: true,
        sortOrder: 1
      }
    });

    // Create Pro Plan
    const proPlan = await prisma.plan.upsert({
      where: { name: 'Pro' },
      update: {},
      create: {
        name: 'Pro',
        displayName: 'Pro Plan',
        description: 'For growing teams and professional developers',
        price: 29.99,
        currency: 'USD',
        interval: 'month',
        features: {
          api_calls: 50000,
          storage_mb: 5000,
          servers_count: 10,
          support_level: 'email',
          custom_domains: true,
          advanced_analytics: true,
          priority_support: false,
          sla_guarantee: false,
          webhook_support: true,
          api_versioning: true
        },
        limits: {
          api_calls: 50000,
          storage_mb: 5000,
          servers_count: 10,
          rate_limit_per_minute: 300,
          concurrent_connections: 100
        },
        isActive: true,
        sortOrder: 2
      }
    });

    // Create Enterprise Plan
    const enterprisePlan = await prisma.plan.upsert({
      where: { name: 'Enterprise' },
      update: {},
      create: {
        name: 'Enterprise',
        displayName: 'Enterprise Plan',
        description: 'For large organizations with advanced requirements',
        price: 199.99,
        currency: 'USD',
        interval: 'month',
        features: {
          api_calls: -1, // Unlimited
          storage_mb: -1, // Unlimited
          servers_count: -1, // Unlimited
          support_level: 'phone',
          custom_domains: true,
          advanced_analytics: true,
          priority_support: true,
          sla_guarantee: true,
          webhook_support: true,
          api_versioning: true,
          white_labeling: true,
          dedicated_support: true,
          custom_integrations: true,
          audit_logs: true
        },
        limits: {
          api_calls: -1, // Unlimited
          storage_mb: -1, // Unlimited
          servers_count: -1, // Unlimited
          rate_limit_per_minute: -1, // Unlimited
          concurrent_connections: -1 // Unlimited
        },
        isActive: true,
        sortOrder: 3
      }
    });

    // Create Annual Pro Plan (with discount)
    const proAnnualPlan = await prisma.plan.upsert({
      where: { name: 'Pro Annual' },
      update: {},
      create: {
        name: 'Pro Annual',
        displayName: 'Pro Annual Plan',
        description: 'Pro plan billed annually with 20% discount',
        price: 287.90, // 29.99 * 12 * 0.8 (20% discount)
        currency: 'USD',
        interval: 'year',
        features: {
          api_calls: 50000,
          storage_mb: 5000,
          servers_count: 10,
          support_level: 'email',
          custom_domains: true,
          advanced_analytics: true,
          priority_support: false,
          sla_guarantee: false,
          webhook_support: true,
          api_versioning: true
        },
        limits: {
          api_calls: 50000,
          storage_mb: 5000,
          servers_count: 10,
          rate_limit_per_minute: 300,
          concurrent_connections: 100
        },
        isActive: true,
        sortOrder: 4
      }
    });

    // Create Annual Enterprise Plan (with discount)
    const enterpriseAnnualPlan = await prisma.plan.upsert({
      where: { name: 'Enterprise Annual' },
      update: {},
      create: {
        name: 'Enterprise Annual',
        displayName: 'Enterprise Annual Plan',
        description: 'Enterprise plan billed annually with 15% discount',
        price: 2039.83, // 199.99 * 12 * 0.85 (15% discount)
        currency: 'USD',
        interval: 'year',
        features: {
          api_calls: -1, // Unlimited
          storage_mb: -1, // Unlimited
          servers_count: -1, // Unlimited
          support_level: 'phone',
          custom_domains: true,
          advanced_analytics: true,
          priority_support: true,
          sla_guarantee: true,
          webhook_support: true,
          api_versioning: true,
          white_labeling: true,
          dedicated_support: true,
          custom_integrations: true,
          audit_logs: true
        },
        limits: {
          api_calls: -1, // Unlimited
          storage_mb: -1, // Unlimited
          servers_count: -1, // Unlimited
          rate_limit_per_minute: -1, // Unlimited
          concurrent_connections: -1 // Unlimited
        },
        isActive: true,
        sortOrder: 5
      }
    });

    console.log('✅ Successfully seeded subscription plans:');
    console.log(`   - ${freePlan.name}: $${freePlan.price}/${freePlan.interval}`);
    console.log(`   - ${proPlan.name}: $${proPlan.price}/${proPlan.interval}`);
    console.log(`   - ${enterprisePlan.name}: $${enterprisePlan.price}/${enterprisePlan.interval}`);
    console.log(`   - ${proAnnualPlan.name}: $${proAnnualPlan.price}/${proAnnualPlan.interval}`);
    console.log(`   - ${enterpriseAnnualPlan.name}: $${enterpriseAnnualPlan.price}/${enterpriseAnnualPlan.interval}`);

    return {
      freePlan,
      proPlan,
      enterprisePlan,
      proAnnualPlan,
      enterpriseAnnualPlan
    };
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedPlans()
    .then(() => {
      console.log('🎉 Plan seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Plan seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedPlans };