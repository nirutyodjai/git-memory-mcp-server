"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAMPLE_BLOG_POSTS = exports.BLOG_TAGS = exports.BLOG_CATEGORIES = void 0;
exports.getBlogPostBySlug = getBlogPostBySlug;
exports.getBlogPostsByCategory = getBlogPostsByCategory;
exports.getBlogPostsByTag = getBlogPostsByTag;
exports.getPublishedBlogPosts = getPublishedBlogPosts;
exports.getRelatedPosts = getRelatedPosts;
exports.calculateReadingTime = calculateReadingTime;
// Sample blog posts data
exports.BLOG_CATEGORIES = [
    {
        id: '1',
        name: 'เทคโนโลยี',
        slug: 'technology',
        description: 'บทความเกี่ยวกับเทคโนโลยีและการพัฒนาซอฟต์แวร์',
        color: '#3B82F6',
        postCount: 5
    },
    {
        id: '2',
        name: 'การออกแบบ',
        slug: 'design',
        description: 'บทความเกี่ยวกับ UI/UX และการออกแบบ',
        color: '#8B5CF6',
        postCount: 3
    },
    {
        id: '3',
        name: 'ประสบการณ์',
        slug: 'experience',
        description: 'ประสบการณ์และเรื่องราวจากการทำงาน',
        color: '#10B981',
        postCount: 2
    }
];
exports.BLOG_TAGS = [
    { id: '1', name: 'React', slug: 'react', postCount: 4 },
    { id: '2', name: 'Next.js', slug: 'nextjs', postCount: 3 },
    { id: '3', name: 'TypeScript', slug: 'typescript', postCount: 5 },
    { id: '4', name: 'UI/UX', slug: 'ui-ux', postCount: 2 },
    { id: '5', name: 'Web Development', slug: 'web-development', postCount: 6 },
    { id: '6', name: 'JavaScript', slug: 'javascript', postCount: 4 }
];
exports.SAMPLE_BLOG_POSTS = [
    {
        id: '1',
        title: 'การเริ่มต้นกับ Next.js 14 และ App Router',
        slug: 'getting-started-with-nextjs-14-app-router',
        excerpt: 'เรียนรู้วิธีการใช้งาน Next.js 14 พร้อมกับ App Router ที่ใหม่และทรงพลัง',
        content: `# การเริ่มต้นกับ Next.js 14 และ App Router

Next.js 14 เป็นเวอร์ชันล่าสุดที่มาพร้อมกับฟีเจอร์ใหม่ๆ มากมาย โดยเฉพาะ App Router ที่จะช่วยให้การพัฒนาเว็บแอปพลิเคชันเป็นไปอย่างมีประสิทธิภาพมากขึ้น

## ความสามารถใหม่ใน Next.js 14

- **Turbopack**: เครื่องมือ bundler ที่เร็วกว่า Webpack ถึง 700 เท่า
- **Server Actions**: การจัดการ form และ API ที่ง่ายขึ้น
- **Partial Prerendering**: การ render แบบผสมผสานระหว่าง static และ dynamic

## การติดตั้ง

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## App Router vs Pages Router

App Router เป็นวิธีการใหม่ในการจัดการ routing ที่มีความยืดหยุ่นและทรงพลังมากกว่า Pages Router แบบเดิม

### ข้อดีของ App Router

1. **Layout ที่ซับซ้อน**: สามารถสร้าง layout ที่ซ้อนกันได้
2. **Loading States**: จัดการ loading state ได้ง่ายขึ้น
3. **Error Handling**: การจัดการ error ที่ดีขึ้น
4. **Streaming**: การโหลดข้อมูลแบบ streaming

## สรุป

Next.js 14 พร้อม App Router เป็นเครื่องมือที่ทรงพลังสำหรับการพัฒนาเว็บแอปพลิเคชันสมัยใหม่ ด้วยประสิทธิภาพที่เพิ่มขึ้นและฟีเจอร์ใหม่ๆ ที่น่าสนใจ`,
        coverImage: '/assets/blog/nextjs-14.jpg',
        author: {
            name: 'นักพัฒนา',
            avatar: '/assets/me.jpg',
            bio: 'Full-stack Developer ที่หลงใหลในเทคโนโลยีใหม่ๆ'
        },
        tags: ['Next.js', 'React', 'Web Development'],
        category: 'เทคโนโลยี',
        publishedAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        isPublished: true,
        readingTime: 5,
        views: 1250,
        likes: 45,
        seo: {
            metaTitle: 'การเริ่มต้นกับ Next.js 14 และ App Router | Blog',
            metaDescription: 'เรียนรู้วิธีการใช้งาน Next.js 14 พร้อมกับ App Router ที่ใหม่และทรงพลัง',
            keywords: ['Next.js', 'App Router', 'React', 'Web Development']
        }
    },
    {
        id: '2',
        title: 'หลักการออกแบบ UI/UX ที่ดี',
        slug: 'good-ui-ux-design-principles',
        excerpt: 'หลักการพื้นฐานในการออกแบบ UI/UX ที่จะทำให้ผู้ใช้มีประสบการณ์ที่ดี',
        content: `# หลักการออกแบบ UI/UX ที่ดี

การออกแบบ UI/UX ที่ดีเป็นสิ่งสำคัญที่จะทำให้ผลิตภัณฑ์ของเราประสบความสำเร็จ

## หลักการพื้นฐาน

### 1. ความเรียบง่าย (Simplicity)
- ใช้สีและฟอนต์ที่เหมาะสม
- หลีกเลี่ยงการใส่องค์ประกอบที่ไม่จำเป็น
- จัดลำดับความสำคัญของข้อมูล

### 2. ความสอดคล้อง (Consistency)
- ใช้ design system ที่เป็นมาตรฐาน
- รักษาความสอดคล้องในทุกหน้า
- ใช้ pattern ที่คุ้นเคย

### 3. การตอบสนอง (Responsiveness)
- ออกแบบให้รองรับทุกขนาดหน้าจอ
- ทดสอบบนอุปกรณ์จริง
- ใช้ flexible layout

## เครื่องมือที่แนะนำ

- **Figma**: สำหรับการออกแบบ
- **Adobe XD**: สำหรับ prototyping
- **Sketch**: สำหรับ macOS users

## สรุป

การออกแบบ UI/UX ที่ดีต้องอาศัยการเข้าใจผู้ใช้และการทดสอบอย่างต่อเนื่อง`,
        coverImage: '/assets/blog/ui-ux-design.jpg',
        author: {
            name: 'นักออกแบบ',
            avatar: '/assets/me.jpg',
            bio: 'UI/UX Designer ที่มีประสบการณ์มากกว่า 5 ปี'
        },
        tags: ['UI/UX', 'Design', 'User Experience'],
        category: 'การออกแบบ',
        publishedAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        isPublished: true,
        readingTime: 7,
        views: 890,
        likes: 32,
        seo: {
            metaTitle: 'หลักการออกแบบ UI/UX ที่ดี | Blog',
            metaDescription: 'หลักการพื้นฐานในการออกแบบ UI/UX ที่จะทำให้ผู้ใช้มีประสบการณ์ที่ดี',
            keywords: ['UI/UX', 'Design', 'User Experience', 'Web Design']
        }
    },
    {
        id: '3',
        title: 'ประสบการณ์การทำงานเป็น Full-stack Developer',
        slug: 'experience-as-fullstack-developer',
        excerpt: 'เรื่องราวและประสบการณ์จากการทำงานเป็น Full-stack Developer',
        content: `# ประสบการณ์การทำงานเป็น Full-stack Developer

การเป็น Full-stack Developer เป็นเส้นทางที่ท้าทายและน่าสนใจ

## จุดเริ่มต้น

เริ่มต้นจากการเรียนรู้ HTML, CSS และ JavaScript พื้นฐาน จากนั้นค่อยๆ ขยายไปยังเทคโนโลยีอื่นๆ

## ทักษะที่จำเป็น

### Frontend
- React/Vue/Angular
- TypeScript
- CSS Frameworks
- State Management

### Backend
- Node.js/Python/Java
- Database (SQL/NoSQL)
- API Design
- Authentication

### DevOps
- Git/GitHub
- CI/CD
- Cloud Services
- Monitoring

## ความท้าทาย

1. **การเรียนรู้อย่างต่อเนื่อง**: เทคโนโลยีเปลี่ยนแปลงอย่างรวดเร็ว
2. **การจัดการเวลา**: ต้องแบ่งเวลาระหว่าง frontend และ backend
3. **ความลึกของความรู้**: ต้องรู้หลายอย่างแต่อาจไม่ลึกเท่าผู้เชี่ยวชาญเฉพาะด้าน

## คำแนะนำ

- เริ่มจากพื้นฐานให้แข็งแกร่ง
- สร้างโปรเจกต์จริงเพื่อฝึกฝน
- เรียนรู้จากชุมชนและ open source
- อย่าหยุดเรียนรู้

## สรุป

การเป็น Full-stack Developer เป็นเส้นทางที่ท้าทายแต่คุ้มค่า ได้เรียนรู้เทคโนโลยีหลากหลายและมีโอกาสในการทำงานที่กว้างขวาง`,
        coverImage: '/assets/blog/fullstack-developer.jpg',
        author: {
            name: 'นักพัฒนา',
            avatar: '/assets/me.jpg',
            bio: 'Full-stack Developer ที่หลงใหลในเทคโนโลยีใหม่ๆ'
        },
        tags: ['Full-stack', 'Career', 'Web Development'],
        category: 'ประสบการณ์',
        publishedAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        isPublished: true,
        readingTime: 8,
        views: 1100,
        likes: 28,
        seo: {
            metaTitle: 'ประสบการณ์การทำงานเป็น Full-stack Developer | Blog',
            metaDescription: 'เรื่องราวและประสบการณ์จากการทำงานเป็น Full-stack Developer',
            keywords: ['Full-stack Developer', 'Career', 'Web Development', 'Programming']
        }
    }
];
// Utility functions
function getBlogPostBySlug(slug) {
    return exports.SAMPLE_BLOG_POSTS.find(post => post.slug === slug && post.isPublished);
}
function getBlogPostsByCategory(category) {
    return exports.SAMPLE_BLOG_POSTS.filter(post => post.category === category && post.isPublished).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
function getBlogPostsByTag(tag) {
    return exports.SAMPLE_BLOG_POSTS.filter(post => post.tags.includes(tag) && post.isPublished).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
function getPublishedBlogPosts() {
    return exports.SAMPLE_BLOG_POSTS.filter(post => post.isPublished)
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
function getRelatedPosts(currentPost, limit = 3) {
    return exports.SAMPLE_BLOG_POSTS
        .filter(post => post.id !== currentPost.id &&
        post.isPublished &&
        (post.category === currentPost.category ||
            post.tags.some(tag => currentPost.tags.includes(tag))))
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, limit);
}
function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}
