import dotenv from 'dotenv';
import { Logger } from '../utils/logger';

dotenv.config();

const logger = new Logger();

async function clearSampleData() {
  try {
    const [{ db }, { categories, products }, drizzleOrm] = await Promise.all([
      import('../db'),
      import('@shared/schema'),
      import('drizzle-orm')
    ]);

    const { inArray } = await import('drizzle-orm');

    // Remove products that match known sample names
    const sampleNames = [
      'Felt Ball Coasters Set',
      'Tibetan Prayer Wheel',
      'Buddha Meditation Statue',
      'Handwoven Scarf',
      'Sample Product 1',
      'Sample Product 2',
      'Sample Product 3'
    ];

    const deletedProducts = await db.delete(products).where(inArray(products.name, sampleNames));
    logger.info('Deleted products rows:', { count: deletedProducts.rowCount ?? 0 });

    // Get all categories and remove them (this will clear all categories)
    const allCategories = await db.select().from(categories);
    const categorySlugs = allCategories.map(cat => cat.slug);
    
    if (categorySlugs.length > 0) {
      const deletedCategories = await db.delete(categories).where(inArray(categories.slug, categorySlugs));
      logger.info('Deleted categories rows:', { count: deletedCategories.rowCount ?? 0 });
    } else {
      logger.info('No categories found to delete');
    }

    process.exit(0);
  } catch (err) {
    logger.error('Failed to clear sample data', err as Error);
    process.exit(1);
  }
}

clearSampleData();
