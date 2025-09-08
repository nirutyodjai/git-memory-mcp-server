"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomCursor = void 0;
const adjectives = [
    "ฉลาด",
    "กล้าหาญ",
    "รวดเร็ว",
    "เงียบ",
    "กระตือรือร้น",
    "กล้า",
    "สดใส",
    "ดุดัน",
    "อ่อนโยน",
    "ทรงพลัง",
    "สูงศักดิ์",
    "ภาคภูมิใจ",
    "รวดเร็ว",
    "สงบ",
    "กล้าหาญ",
];
const nouns = [
    "เสือ",
    "สิงโต",
    "นกอินทรี",
    "เหยี่ยว",
    "หมาป่า",
    "เสือดำ",
    "เหยี่ยว",
    "หมี",
    "วาฬ",
    "จิ้งจอก",
    "แมวป่า",
    "นาก",
    "งู",
    "มังกร",
    "นกฟีนิกซ์",
];
const colors = [
    "#60a5fa",
    "#f87171",
    "#4ade80",
    "#facc15",
    "#c084fc",
    "#fb923c",
    "#f43f5e",
    "#818cf8",
    "#22d3ee",
    "#a3e635",
];
const randomPicker = (items) => {
    let index = 0;
    const _items = items.sort(() => Math.random() - 0.5);
    return () => {
        return _items[index++ % _items.length];
    };
};
const generateRandomCursor = () => {
    const colorPicker = randomPicker(colors);
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const name = `${randomAdjective} ${randomNoun}`;
    const color = colorPicker();
    return { name, color };
};
exports.generateRandomCursor = generateRandomCursor;
