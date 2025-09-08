import { aiServicesManager, aiCodeGenerator } from './src/services';

// เริ่มต้นระบบ
await aiServicesManager.initialize();
await aiServicesManager.start();

// สแกนหาโค้ดซ้ำ
const duplicates = await aiCodeGenerator.scanForDuplicates('./src');

// สร้างฟังก์ชันจากโค้ดซ้ำ
for (const duplicate of duplicates) {
  await aiCodeGenerator.extractFunction(duplicate.id);
}