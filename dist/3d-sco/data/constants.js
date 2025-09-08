"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.themeDisclaimers = exports.SKILLS = exports.SkillNames = void 0;
// thoda zada ts ho gya idhar
var SkillNames;
(function (SkillNames) {
    SkillNames["AWS"] = "aws";
    // AZURE = "azure",    // +
    SkillNames["LINUX"] = "linux";
    // SHELL = "shell",    // +
    // PYTHON = "python",  // +
    SkillNames["GIT"] = "git";
    SkillNames["DOCKER"] = "docker";
    // SELENIUM = "selenium",  // +
    // JENKINS = "jenkins",    // +
    // KUBERNETES = "kubernetes",  // +
    // ANSIBLE = "ansible",    // +
    // TERRAFORM = "terraform",  // +
    // PROMETHEUS = "prometheus",  // +
    // GRAFANA = "grafana",    // +
    // SONARQUBE = "sonarqube",  // +
    // OWASP = "owasp",    // +
    // TRIVY = "trivy",    // +
    // MAVEN = "maven",    // +
    // GO = "go",        // +
    SkillNames["HTML"] = "html";
    SkillNames["CSS"] = "css";
    SkillNames["JS"] = "js";
    // JAVA = "java",    // +
    SkillNames["POSTGRES"] = "postgres";
    SkillNames["TS"] = "ts";
    SkillNames["REACT"] = "react";
    SkillNames["VUE"] = "vue";
    SkillNames["NEXTJS"] = "nextjs";
    SkillNames["TAILWIND"] = "tailwind";
    SkillNames["NODEJS"] = "nodejs";
    SkillNames["EXPRESS"] = "express";
    SkillNames["MONGODB"] = "mongodb";
    SkillNames["GITHUB"] = "github";
    SkillNames["PRETTIER"] = "prettier";
    SkillNames["NPM"] = "npm";
    SkillNames["FIREBASE"] = "firebase";
    SkillNames["WORDPRESS"] = "wordpress";
    SkillNames["NGINX"] = "nginx";
    SkillNames["VIM"] = "vim";
    SkillNames["VERCEL"] = "vercel";
})(SkillNames || (exports.SkillNames = SkillNames = {}));
exports.SKILLS = {
    [SkillNames.JS]: {
        id: 1,
        name: "js",
        label: "JavaScript",
        shortDescription: "ยิงโค้ดเข้า DOM ตั้งแต่ปี '95 จนถึงตอนนี้! 💯🚀",
        color: "#f0db4f",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
    },
    [SkillNames.TS]: {
        id: 2,
        name: "ts",
        label: "TypeScript",
        shortDescription: "ลูกพี่ลูกน้องของ JavaScript ที่ทำงานหนักเกินไปและชอบอวด 💯🔒",
        color: "#007acc",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
    },
    [SkillNames.HTML]: {
        id: 3,
        name: "html",
        label: "HTML",
        shortDescription: "ปู่ทวดของอินเทอร์เน็ต ยังคงเจ๋งอยู่เลย! 💀🔥",
        color: "#e34c26",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
    },
    [SkillNames.CSS]: {
        id: 4,
        name: "css",
        label: "CSS",
        shortDescription: "จัดแต่งสไตล์ด้วยความเท่สุดๆ ไม่มีโกหก 💁‍♂️🔥",
        color: "#563d7c",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
    },
    [SkillNames.REACT]: {
        id: 5,
        name: "react",
        label: "React",
        shortDescription: `"ใช้การใช้" 
ใช้ use = useUsing("use")`,
        color: "#61dafb",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    },
    [SkillNames.VUE]: {
        id: 6,
        name: "vue",
        label: "Vue",
        shortDescription: "ยาสงบสำหรับ frontend ของคุณ มันต่างออกไปจริงๆ! 🟢😌",
        color: "#41b883",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
    },
    [SkillNames.NEXTJS]: {
        id: 7,
        name: "nextjs",
        label: "Next.js",
        shortDescription: "ราชินีแห่งดราม่าของ front-end frameworks และเราก็รักมัน! 👑📜",
        color: "#fff",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    },
    [SkillNames.TAILWIND]: {
        id: 8,
        name: "tailwind",
        label: "Tailwind",
        shortDescription: "คลาส utility ที่ต่างออกไปจริงๆ 🌪️🔥",
        color: "#38bdf8",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg",
    },
    [SkillNames.NODEJS]: {
        id: 9,
        name: "nodejs",
        label: "Node.js",
        shortDescription: "JavaScript บอกว่า 'หลอกเล่น ตอนนี้ฉันเป็น backend แล้ว' จริงๆ! 🔙🔚",
        color: "#6cc24a",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    },
    [SkillNames.EXPRESS]: {
        id: 10,
        name: "express",
        label: "Express",
        shortDescription: "middlewares ทำงานหนักมาก ไม่โกหก! 🚂💨",
        color: "#fff",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg",
    },
    [SkillNames.POSTGRES]: {
        id: 11,
        name: "postgres",
        label: "PostgreSQL",
        shortDescription: "SQL แต่ทำให้เท่ห์ขึ้น เมี๊ยว 💅🐘",
        color: "#336791",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
    },
    [SkillNames.MONGODB]: {
        id: 12,
        name: "mongodb",
        label: "MongoDB",
        shortDescription: "อวดด้วย NoSQL อย่างมีสไตล์ ด้วยความเคารพ! 💪🍃",
        color: "#336791",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
    },
    [SkillNames.GIT]: {
        id: 13,
        name: "git",
        label: "Git",
        shortDescription: "บอดี้การ์ดส่วนตัวของโค้ด ไม่โกหก! 🕵️‍♂️🔄",
        color: "#f1502f",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
    },
    [SkillNames.GITHUB]: {
        id: 14,
        name: "github",
        label: "GitHub",
        shortDescription: "แอบเข้าไปใน pull requests หากคุณรู้ก็รู้! 🐙",
        color: "#000000",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
    },
    [SkillNames.PRETTIER]: {
        id: 15,
        name: "prettier",
        label: "Prettier",
        shortDescription: "ทำให้โค้ดของคุณไม่ยุ่งเหยิง ขอบคุณนะ 🧹✨",
        color: "#f7b93a",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prettier/prettier-original.svg",
    },
    [SkillNames.NPM]: {
        id: 16,
        name: "npm",
        label: "NPM",
        shortDescription: "package manager บอกว่า 'ฉันช่วยเธอได้ เพื่อน' จบ! 📦💯",
        color: "#fff",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg",
    },
    [SkillNames.FIREBASE]: {
        id: 17,
        name: "firebase",
        label: "Firebase",
        shortDescription: "เพื่อนซี้สุดยอดของแอปคุณ แต่ระวังการติดกับผู้ให้บริการ! 🔥👌",
        color: "#ffca28",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
    },
    [SkillNames.WORDPRESS]: {
        id: 18,
        name: "wordpress",
        label: "WordPress",
        shortDescription: "ปู่ทวดของ CMS ยังคงเท่ห์ด้วยไม้เท้า 🧓👴",
        color: "#007acc",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wordpress/wordpress-plain.svg",
    },
    [SkillNames.LINUX]: {
        id: 19,
        name: "linux",
        label: "Linux",
        shortDescription: "ที่ซึ่ง 'chmod 777' คือการอวดสุดยอด 🔓🙌",
        color: "#fff",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
    },
    [SkillNames.DOCKER]: {
        id: 20,
        name: "docker",
        label: "Docker",
        shortDescription: "การทำ containerization ที่ดีที่สุด! 🐳🔥",
        color: "#2496ed",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
    },
    [SkillNames.NGINX]: {
        id: 21,
        name: "nginx",
        label: "NginX",
        shortDescription: "reverse proxy วิ่งซู่ซ่า โอ้โห! 🚗💨",
        color: "#008000",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg",
    },
    [SkillNames.AWS]: {
        id: 22,
        name: "aws",
        label: "AWS",
        shortDescription: "มักจะเกินไป ทำให้ทุกอย่างซับซ้อนขึ้น จบ! 🌐👨‍💻",
        color: "#ff9900",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aws/aws-original.svg",
    },
    [SkillNames.VIM]: {
        id: 23,
        name: "vim",
        label: "Vim",
        shortDescription: "ออก? ในสภาพเศรษฐกิจแบบนี้? โอเค ฉันจะออกไป! 🚪🏃",
        color: "#e34c26",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vim/vim-original.svg",
    },
    [SkillNames.VERCEL]: {
        id: 24,
        name: "vercel",
        label: "Vercel",
        shortDescription: "บริษัทสามเหลี่ยม ช่วยคุณ deploy แล้วไปสัมผัสหญ้า! 🚀🌿",
        color: "#6cc24a",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg",
    },
};
// +
// export const SKILLS: Record<SkillNames, Skill> = {
//   [SkillNames.AWS]: {
//     id: 1,
//     name: "aws",
//     label: "AWS",
//     shortDescription: "Cloud magic 🪄 that makes deploying infra feel like playing The Sims but for servers. ☁️💻",
//     color: "#ff9900",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aws/aws-original.svg",
//   },
//   [SkillNames.AZURE]: {
//     id: 2,
//     name: "azure",
//     label: "Azure",
//     shortDescription:
//       "Microsoft’s Hey, we do cloud too flex. 🌥️🔗",
//     color: "#007acc",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
//   },
//   [SkillNames.LINUX]: {
//     id: 3,
//     name: "linux",
//     label: "LINUX",
//     shortDescription: "That OS which powers the internet but will make you feel like a hacker every time you use the terminal. 💻😎",
//     color: "#e34c26",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-plain.svg",
//   },
//   [SkillNames.SHELL]: {
//     id: 4,
//     name: "shell",
//     label: "Shell Scripting",
//     shortDescription: "Automating boring stuff so you can sit back and sip chai ☕ while your scripts do the heavy lifting",
//     color: "#563d7c",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bash/bash-plain.svg",
//   },
//   [SkillNames.PYTHON]: {
//     id: 5,
//     name: "python",
//     label: "Python",
//     shortDescription: "The coding equivalent of 'It just works' — even when you barely know what you're doing. 🐍📜",
//     color: "#61dafb",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
//   },
//   [SkillNames.GIT]: {
//     id: 6,
//     name: "git",
//     label: "GIT",
//     shortDescription:
//       "Messing up your code? No worries, just 'commit' your sins and 'revert' like nothing happened. 😂🔧",
//     color: "#41b883",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg",
//   },
//   [SkillNames.DOCKER]: {
//     id: 7,
//     name: "docker",
//     label: "Docker",
//     shortDescription:
//       "Packing apps like Tupperware packs leftovers — neat, portable, and ready to reheat. 🐳📦",
//     color: "#fff",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
//   },
//   [SkillNames.SELENIUM]: {
//     id: 8,
//     name: "selenium",
//     label: "Selenium",
//     shortDescription: "Browser babysitting on steroids. Click-click-done! 🖱️🤖",
//     color: "#38bdf8",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/selenium/selenium-original.svg",
//   },
//   [SkillNames.JENKINS]: {
//     id: 9,
//     name: "jenkins",
//     label: "Jenkins",
//     shortDescription: "The 'butler' who builds and deploys your code but complains with every red build. 🤵🚦",
//     color: "#6cc24a",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jenkins/jenkins-original.svg",
//   },
//   [SkillNames.KUBERNETES]: {
//     id: 10,
//     name: "kubernetes",
//     label: "Kubernetes",
//     shortDescription: "Herding containers like a pro rancher. Yeehaw, pods! 🐂⛴️",
//     color: "#fff",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-original.svg",
//   },
//   [SkillNames.ANSIBLE]: {
//     id: 11,
//     name: "ansible",
//     label: "Ansible",
//     shortDescription: "Automation so simple even your non-techie friend would think it’s just magic. 🪄📜",
//     color: "#336791",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ansible/ansible-original.svg",
//   },
//   [SkillNames.TERRAFORM]: {
//     id: 12,
//     name: "terraform",
//     label: "Terraform",
//     shortDescription: "Building cloud infra like playing Lego — but with code. 🧱🌍",
//     color: "#336791",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/terraform/terraform-original.svg",
//   },
//   [SkillNames.PROMETHEUS]: {
//     id: 13,
//     name: "prometheus",
//     label: "Prometheus",
//     shortDescription: "Your system’s stalker — knows all the CPU gossip. 📈👀",
//     color: "#f1502f",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prometheus/prometheus-original.svg",
//   },
//   [SkillNames.GRAFANA]: {
//     id: 14,
//     name: "grafana",
//     label: "Grafana",
//     shortDescription: "Turning boring metrics into Pinterest-worthy dashboards. 📊✨",
//     color: "#000000",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/grafana/grafana-original.svg",
//   },
//   [SkillNames.SONARQUBE]: {
//     id: 15,
//     name: "sonarqube",
//     label: "Sonarqube",
//     shortDescription: "The code snitch that tells you how bad you are at writing clean code. 🐠🤐",
//     color: "#f7b93a",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sonarqube/sonarqube-original.svg",
//   },
//   [SkillNames.OWASP]: {
//     id: 16,
//     name: "owasp",
//     label: "OWASP",
//     shortDescription: "Your checklist for keeping hackers from crashing your web party. 🕵️🔒",
//     color: "#fff",
//     icon: "assets/icons/owasp-svgrepo-com.svg",
//   },
//   [SkillNames.TRIVY]: {
//     id: 17,
//     name: "trivy",
//     label: "Trivy",
//     shortDescription:
//       "Scans your containers for vulnerabilities like your mom checks your room for mess. 🚨🔍",
//     color: "#ffca28",
//     icon: "https://logo.svgcdn.com/s/trivy-dark.svg",
//   },
//   [SkillNames.MAVEN]: {
//     id: 18,
//     name: "maven",
//     label: "Maven",
//     shortDescription: "The build tool that's also really into managing dependencies. 📚🔧",
//     color: "#007acc",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/maven/maven-original.svg",
//   },
//   [SkillNames.GO]: {
//     id: 19,
//     name: "go",
//     label: "GO",
//     shortDescription: "Fast, minimal, and powerful — basically the 'straight-A student' of programming. 🏃‍♂️💻",
//     color: "#fff",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg",
//   },
//   [SkillNames.HTML]: {
//     id: 20,
//     name: "html",
//     label: "HTML",
//     shortDescription: "The bones of every website — no frills, just structure. 🦴🌐",
//     color: "#2496ed",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
//   },
//   [SkillNames.CSS]: {
//     id: 21,
//     name: "nginx",
//     label: "NginX",
//     shortDescription: "Because no one likes plain — add some drip to your HTML. 🎨✨",
//     color: "#008000",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",
//   },
//   [SkillNames.JS]: {
//     id: 22,
//     name: "javascript",
//     label: "JavaScript",
//     shortDescription:
//       "Making your websites less boring and more 'click here to know your future.' 🖱️🪄",
//     color: "#ff9900",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
//   },
//   [SkillNames.JAVA]: {
//     id: 23,
//     name: "java",
//     label: "Java",
//     shortDescription: "The OG workhorse that still runs a zillion enterprise apps — slow but steady. 🏋️‍♂️☕",
//     color: "#e34c26",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
//   },
//   [SkillNames.POSTGRES]: {
//     id: 24,
//     name: "postgres",
//     label: "Postgres",
//     shortDescription:
//       "Data’s personal diary — secure, organized, and occasionally moody with your queries. 📔🛠️",
//     color: "#6cc24a",
//     icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
//   },
// };
exports.themeDisclaimers = {
    light: [
        "คำเตือน: โหมดสว่างปล่อยแสงสว่างล้านลูเมน!",
        "ระวัง: โหมดสว่างข้างหน้า! กรุณาอย่าลองทำที่บ้าน",
        "มีเพียงผู้เชี่ยวชาญเท่านั้นที่จัดการความสว่างนี้ได้ ใส่แว่นกันแดดก่อนดำเนินการ!",
        "เตรียมตัวให้พร้อม! โหมดสว่างจะทำให้ทุกอย่างสว่างกว่าอนาคตของคุณ",
        "กำลังเปลี่ยนเป็นโหมดสว่าง... แน่ใจหรือว่าตาของคุณพร้อมแล้ว?",
    ],
    dark: [
        "โหมดสว่าง? ฉันคิดว่าคุณเสียสติ... แต่ยินดีต้อนรับกลับสู่ด้านมืด!",
        "กำลังเปลี่ยนเป็นโหมดมืด... ชีวิตในด้านสว่างเป็นอย่างไรบ้าง?",
        "เปิดโหมดมืดแล้ว! ขอบคุณจากใจจริงและจากดวงตาของฉันด้วย",
        "ยินดีต้อนรับกลับสู่เงามืด ชีวิตในแสงสว่างข้างนอกนั้นเป็นอย่างไร?",
        "เปิดโหมดมืด! ในที่สุดก็มีคนที่เข้าใจความซับซ้อนที่แท้จริง",
    ],
};
