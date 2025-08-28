"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aceternity_1 = __importDefault(require("@/components/logos/aceternity"));
const slide_show_1 = __importDefault(require("@/components/slide-show"));
const button_1 = require("@/components/ui/button");
const typography_1 = require("@/components/ui/typography");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const ri_1 = require("react-icons/ri");
const si_1 = require("react-icons/si");
const tb_1 = require("react-icons/tb");
const BASE_PATH = "/assets/projects-screenshots";
const ProjectsLinks = ({ live, repo }) => {
    return (<div className="flex flex-col md:flex-row items-center justify-start gap-3 my-3 mb-8">
      <link_1.default className="font-mono underline flex gap-2" rel="noopener" target="_new" href={live}>
        <button_1.Button variant={"default"} size={"sm"}>
          เยี่ยมชมเว็บไซต์
          <lucide_react_1.ArrowUpRight className="ml-3 w-5 h-5"/>
        </button_1.Button>
      </link_1.default>
      {repo && (<link_1.default className="font-mono underline flex gap-2" rel="noopener" target="_new" href={repo}>
          <button_1.Button variant={"default"} size={"sm"}>
            Github
            <lucide_react_1.ArrowUpRight className="ml-3 w-5 h-5"/>
          </button_1.Button>
        </link_1.default>)}
    </div>);
};
const PROJECT_SKILLS = {
    next: {
        title: "Next.js",
        bg: "black",
        fg: "white",
        icon: <ri_1.RiNextjsFill />,
    },
    chakra: {
        title: "Chakra UI",
        bg: "black",
        fg: "white",
        icon: <si_1.SiChakraui />,
    },
    node: {
        title: "Node.js",
        bg: "black",
        fg: "white",
        icon: <ri_1.RiNodejsFill />,
    },
    python: {
        title: "Python",
        bg: "black",
        fg: "white",
        icon: <si_1.SiPython />,
    },
    prisma: {
        title: "prisma",
        bg: "black",
        fg: "white",
        icon: <si_1.SiPrisma />,
    },
    postgres: {
        title: "PostgreSQL",
        bg: "black",
        fg: "white",
        icon: <si_1.SiPostgresql />,
    },
    mongo: {
        title: "MongoDB",
        bg: "black",
        fg: "white",
        icon: <si_1.SiMongodb />,
    },
    express: {
        title: "Express",
        bg: "black",
        fg: "white",
        icon: <si_1.SiExpress />,
    },
    reactQuery: {
        title: "React Query",
        bg: "black",
        fg: "white",
        icon: <si_1.SiReactquery />,
    },
    shadcn: {
        title: "ShanCN UI",
        bg: "black",
        fg: "white",
        icon: <si_1.SiShadcnui />,
    },
    aceternity: {
        title: "Aceternity",
        bg: "black",
        fg: "white",
        icon: <aceternity_1.default />,
    },
    tailwind: {
        title: "Tailwind",
        bg: "black",
        fg: "white",
        icon: <si_1.SiTailwindcss />,
    },
    docker: {
        title: "Docker",
        bg: "black",
        fg: "white",
        icon: <si_1.SiDocker />,
    },
    yjs: {
        title: "Y.js",
        bg: "black",
        fg: "white",
        icon: (<span>
        <strong>Y</strong>js
      </span>),
    },
    firebase: {
        title: "Firebase",
        bg: "black",
        fg: "white",
        icon: <si_1.SiFirebase />,
    },
    sockerio: {
        title: "Socket.io",
        bg: "black",
        fg: "white",
        icon: <si_1.SiSocketdotio />,
    },
    js: {
        title: "JavaScript",
        bg: "black",
        fg: "white",
        icon: <si_1.SiJavascript />,
    },
    ts: {
        title: "TypeScript",
        bg: "black",
        fg: "white",
        icon: <si_1.SiTypescript />,
    },
    vue: {
        title: "Vue.js",
        bg: "black",
        fg: "white",
        icon: <si_1.SiVuedotjs />,
    },
    react: {
        title: "React.js",
        bg: "black",
        fg: "white",
        icon: <ri_1.RiReactjsFill />,
    },
    sanity: {
        title: "Sanity",
        bg: "black",
        fg: "white",
        icon: <si_1.SiSanity />,
    },
    spline: {
        title: "Spline",
        bg: "black",
        fg: "white",
        icon: <si_1.SiThreedotjs />,
    },
    gsap: {
        title: "GSAP",
        bg: "black",
        fg: "white",
        icon: "",
    },
    framerMotion: {
        title: "Framer Motion",
        bg: "black",
        fg: "white",
        icon: <tb_1.TbBrandFramerMotion />,
    },
    supabase: {
        title: "Supabase",
        bg: "black",
        fg: "white",
        icon: <si_1.SiSupabase />,
    },
    // +
    vite: {
        title: "Vite",
        bg: "black",
        fg: "white",
        icon: <si_1.SiVite />,
    },
    openai: {
        title: "OpenAI",
        bg: "black",
        fg: "white",
        icon: <img src="assets/icons/openai-svgrepo-com_white.svg" alt="OpenAI"/>,
    },
    netlify: {
        title: "Netlify",
        bg: "black",
        fg: "white",
        icon: <si_1.SiNetlify />,
    },
    html: {
        title: "HTML5",
        bg: "black",
        fg: "white",
        icon: <si_1.SiHtml5 />,
    },
    css: {
        title: "CSS3",
        bg: "black",
        fg: "white",
        icon: <si_1.SiCss3 />,
    },
    bootstrap: {
        title: "Bootstrap",
        bg: "black",
        fg: "white",
        icon: <si_1.SiBootstrap />,
    },
    maven: {
        title: "Maven",
        bg: "black",
        fg: "white",
        icon: <si_1.SiApachemaven />,
    },
    java: {
        title: "Java",
        bg: "black",
        fg: "white",
        icon: <img src="assets/icons/icons8-java.svg" alt="Java"/>,
    },
    cplusplus: {
        title: "C++",
        bg: "black",
        fg: "white",
        icon: <si_1.SiCplusplus />,
    },
    arduino: {
        title: "Arduino",
        bg: "black",
        fg: "white",
        icon: <si_1.SiArduino />,
    },
};
const projects = [
    // {
    //   id: "codingducks",
    //   category: "Coding platform",
    //   title: "Coding Ducks",
    //   src: "/assets/projects-screenshots/codingducks/landing.png",
    //   screenshots: ["landing.png"],
    //   skills: {
    //     frontend: [
    //       PROJECT_SKILLS.ts,
    //       PROJECT_SKILLS.next,
    //       PROJECT_SKILLS.chakra,
    //       PROJECT_SKILLS.reactQuery,
    //       PROJECT_SKILLS.firebase,
    //     ],
    //     backend: [
    //       PROJECT_SKILLS.node,
    //       PROJECT_SKILLS.express,
    //       PROJECT_SKILLS.prisma,
    //       PROJECT_SKILLS.python,
    //       PROJECT_SKILLS.postgres,
    //       PROJECT_SKILLS.sockerio,
    //     ],
    //   },
    //   live: "https://www.codingducks.xyz/",
    //   github: "https://github.com/Naresh-Khatri/Coding-Ducks",
    //   get content() {
    //     return (
    //       <div>
    //         <TypographyP className="font-mono text-2xl text-center">
    //           Coding ducks = LeetCode + CodePen + CSS Battles
    //         </TypographyP>
    //         <TypographyP className="font-mono ">
    //           Coding Ducks is your coding dojo — where you level up your skills,
    //           battle in real-time code duels, and earn badges like a true code
    //           warrior. Track your progress, flex your brain, and climb the
    //           leaderboard. Ready to quack the code?
    //         </TypographyP>
    //         <ProjectsLinks live={this.live} repo={this.github} />
    //         <TypographyH3 className="my-4 mt-8">Problems </TypographyH3>
    //         <p className="font-mono mb-2">
    //           Solve coding problems similar to LeetCode, enhancing your
    //           problem-solving skills across various languages.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/codingducks/problems.png`,
    //             `${BASE_PATH}/codingducks/problem.png`,
    //           ]}
    //         />
    //         <TypographyH3 className="my-4 mt-8">Ducklets</TypographyH3>
    //         <p className="font-mono mb-2">
    //           Collaborate in real-time with others in a multiplayer coding
    //           environment, just like CodePen but with a social twist.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/codingducks/ducklets.png`,
    //             `${BASE_PATH}/codingducks/ducklet1.png`,
    //             `${BASE_PATH}/codingducks/ducklet2.png`,
    //           ]}
    //         />
    //         <TypographyH3 className="my-4 mt-8">UI Battles </TypographyH3>
    //         <p className="font-mono mb-2">
    //           Challenge yourself to create UI components with HTML/CSS/JS, and get
    //           instant feedback with an automated similarity scoring.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/codingducks/css-battles.png`,
    //             `${BASE_PATH}/codingducks/css-battle.png`,
    //             `${BASE_PATH}/codingducks/css-battle2.png`,
    //           ]}
    //         />
    //         <TypographyH3 className="my-4 mt-8">Contests </TypographyH3>
    //         <p className="font-mono mb-2">
    //           Organize or participate in coding competitions. Successfully used to
    //           host three contests during college.
    //         </p>
    //         <SlideShow images={[`${BASE_PATH}/codingducks/contests.png`]} />
    //         <TypographyH3 className="my-4 mt-8">Playground </TypographyH3>
    //         <p className="font-mono mb-2">
    //           Test and execute your code instantly in my versatile online code
    //           runner.
    //         </p>
    //         <SlideShow images={[`${BASE_PATH}/codingducks/playground.png`]} />
    //         <TypographyH3 className="my-4 mt-8">Users</TypographyH3>
    //         <p className="font-mono mb-2">
    //           Track your progress, earn badges, and climb the rankings with
    //           detailed user profiles and activity tracking.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/codingducks/users.png`,
    //             `${BASE_PATH}/codingducks/user.png`,
    //           ]}
    //         />
    //       </div>
    //     );
    //   },
    // },
    // {
    //   id: "couponluxury",
    //   category: "Coupon site",
    //   title: "Coupon Luxury",
    //   src: "/assets/projects-screenshots/couponluxury/landing.png",
    //   screenshots: ["1.png", "2.png", "3.png", "4.png", "5.png"],
    //   live: "https://www.couponluxury.com/",
    //   skills: {
    //     frontend: [
    //       PROJECT_SKILLS.js,
    //       PROJECT_SKILLS.next,
    //       PROJECT_SKILLS.chakra,
    //       PROJECT_SKILLS.vue,
    //     ],
    //     backend: [
    //       PROJECT_SKILLS.node,
    //       PROJECT_SKILLS.express,
    //       PROJECT_SKILLS.prisma,
    //       PROJECT_SKILLS.postgres,
    //       PROJECT_SKILLS.docker,
    //     ],
    //   },
    //   get content(): JSX.Element {
    //     return (
    //       <div>
    //         <TypographyP className="font-mono ">
    //           CouponLuxury is your go-to destination for snagging the best deals
    //           without lifting a finger. Whether you&apos;re hunting for the latest
    //           discounts or trying to save a buck at your favorite stores,
    //           CouponLuxury&apos;s got you covered.
    //         </TypographyP>
    //         <ProjectsLinks live={this.live} repo={this.github} />
    //         <p className="font-mono mb-2 mt-4">
    //           As soon as you land, boom! You&apos;re greeted with the freshest
    //           coupons and top-tier deals that&apos;ll make your wallet happy.
    //         </p>
    //         <SlideShow images={[`${BASE_PATH}/couponluxury/landing.png`]} />
    //         <TypographyH3 className="my-4 ">Stores</TypographyH3>
    //         <p className="font-mono mb-2">
    //           Dive into a comprehensive list of stores, each packed with exclusive
    //           deals and discounts. It&apos;s like having a VIP pass to every sale
    //           in town.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/couponluxury/stores.png`,
    //             `${BASE_PATH}/couponluxury/store.png`,
    //           ]}
    //         />
    //         <TypographyH3 className="my-4 mt-8">Categories</TypographyH3>
    //         <p className="font-mono mb-2">
    //           Whatever you&apos;re into—fashion, tech, food—you&apos;ll find it
    //           neatly organized here. No more endless scrolling; just pick a
    //           category and get the best offers instantly.
    //         </p>
    //         <SlideShow images={[`${BASE_PATH}/couponluxury/categories.png`]} />
    //         <TypographyH3 className="my-4 mt-8">Custom CMS </TypographyH3>
    //         <p className="font-mono mb-2">
    //           Powered by Vue.js, this bad boy allows us to keep the content
    //           dynamic and up-to-date. From flash sales to limited-time offers, my
    //           CMS ensures everything&apos;s live and relevant.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/couponluxury/cms-1.png`,
    //             `${BASE_PATH}/couponluxury/cms-2.png`,
    //           ]}
    //         />
    //         <p className="font-mono mb-2 mt-5">
    //           Plus, I&apos;ve sprinkled in some extra magic like personalized
    //           deal recommendations, user-friendly search features, and a sleek,
    //           responsive design that works like a charm on any device.
    //         </p>
    //         <p className="font-mono mb-2">
    //           CouponLuxury isn&apos;t just a website; it&apos;s your personal deal-hunting
    //           assistant, ensuring you never miss out on a bargain!
    //         </p>
    //         {/* <TypographyP className="my-4 mt-8">
    //         <strong>Misc:</strong>
    //         Hosted not one, not two, but THREE coding contests (Codemacha) during
    //         college. Safe to say, Coding Ducks passed the vibe check.
    //       </TypographyP>
    //       <TypographyP className="my-4 mt-8">
    //         <strong>Target Audience:</strong>
    //         For all the novice coders out there ready to make their mark.
    //       </TypographyP> */}
    //       </div>
    //     );
    //   },
    // },
    // {
    //   id: "the-booking-desk",
    //   category: "Travel",
    //   title: "The Booking Desk",
    //   src: "/assets/projects-screenshots/the-booking-desk/landing.png",
    //   screenshots: ["1.png"],
    //   live: "https://thebookingdesk.com/",
    //   skills: {
    //     frontend: [
    //       PROJECT_SKILLS.ts,
    //       PROJECT_SKILLS.next,
    //       PROJECT_SKILLS.aceternity,
    //       PROJECT_SKILLS.tailwind,
    //     ],
    //     backend: [PROJECT_SKILLS.sanity],
    //   },
    //   get content() {
    //     return (
    //       <div>
    //         <TypographyP className="font-mono ">
    //           The Booking Desk is your ultimate travel consultation hub, designed
    //           to turn your wanderlust dreams into reality. With a focus on smooth
    //           and visually captivating animations, navigating the site feels like
    //           a breeze—it&apos;s almost as if the destinations are calling you.
    //         </TypographyP>
    //         <ProjectsLinks live={this.live} repo={this.github} />
    //         <p className="font-mono mb-2 mt-8">
    //           A sleek, modern interface greets you, featuring the latest travel
    //           tips, deals, and must-visit spots around the globe.
    //         </p>
    //         <SlideShow images={[`${BASE_PATH}/the-booking-desk/landing.png`]} />
    //         <TypographyH3 className="my-4 mt-8">Blogs</TypographyH3>
    //         <p className="font-mono mb-2">
    //           Dive into the curated articles written by travel experts. Whether
    //           you&apos;re looking for hidden gems or travel hacks, our blog section has
    //           you covered.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/the-booking-desk/blogs.png`,
    //             `${BASE_PATH}/the-booking-desk/blog.png`,
    //           ]}
    //         />
    //         <TypographyH3 className="my-4 mt-8">Sanity CMS</TypographyH3>
    //         <p className="font-mono mb-2">
    //           Keeping everything fresh and up-to-date, I&apos;ve integrated Sanity CMS
    //           to manage all the content with ease, ensuring you always get the
    //           latest and greatest information.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/the-booking-desk/cms-1.png`,
    //             `${BASE_PATH}/the-booking-desk/cms-2.png`,
    //           ]}
    //         />
    //         <p className="font-mono mb-2 my-8">
    //           With a stunning 100% score on Lighthouse, The Booking Desk isn&apos;t
    //           just beautiful—it&apos;s built to perform. Whether you&apos;re planning your
    //           next adventure or just daydreaming, our site delivers a top-notch
    //           experience that&apos;s both informative and enjoyable.
    //         </p>
    //       </div>
    //     );
    //   },
    // },
    // { // Portfolio project
    //   id: "portfolio",
    //   category: "Portfolio",
    //   title: "My Portfolio",
    //   src: "/assets/projects-screenshots/portfolio/landing.png",
    //   screenshots: ["1.png"],
    //   live: "http://nareshkhatri.vercel.app",
    //   github:"https://github.com/Naresh-Khatri/Portfolio",
    //   skills: {
    //     frontend: [
    //       PROJECT_SKILLS.ts,
    //       PROJECT_SKILLS.next,
    //       PROJECT_SKILLS.shadcn,
    //       PROJECT_SKILLS.aceternity,
    //       PROJECT_SKILLS.framerMotion,
    //       PROJECT_SKILLS.tailwind,
    //       PROJECT_SKILLS.spline,
    //     ],
    //     backend: [],
    //   },
    //   get content() {
    //     return (
    //       <div>
    //         <TypographyP className="font-mono ">
    //           Welcome to my digital playground, where creativity meets code in the
    //           dopest way possible.
    //         </TypographyP>
    //         <ProjectsLinks live={this.live} repo={this.github} />
    //         <TypographyH3 className="my-4 mt-8">
    //           Beautiful 3D Objects{" "}
    //         </TypographyH3>
    //         <p className="font-mono mb-2">
    //           Did you see that 3D keyboard modal? Yeah! I made that. That
    //           interactive keyboard is being rendered in 3D on a webpage 🤯, and
    //           pressing each keycap reveals a skill in a goofy way. It&apos;s like
    //           typing, but make it art.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/portfolio/landing.png`,
    //             `${BASE_PATH}/portfolio/skills.png`,
    //           ]}
    //         />
    //         <TypographyH3 className="my-4 ">Space Theme</TypographyH3>
    //         <p className="font-mono mb-2">
    //           Dark background + floating particles = out-of-this-world cool.
    //         </p>
    //         <SlideShow images={[`${BASE_PATH}/portfolio/navbar.png`]} />
    //         <TypographyH3 className="my-4 mt-8">Projects</TypographyH3>
    //         <p className="font-mono mb-2">
    //           My top personal and freelance projects — no filler, all killer.
    //         </p>
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/portfolio/projects.png`,
    //             `${BASE_PATH}/portfolio/project.png`,
    //           ]}
    //         />
    //         <p className="font-mono mb-2 mt-8 text-center">
    //           This site&apos;s not just a portfolio — it&apos;s a whole vibe.
    //         </p>
    //       </div>
    //     );
    //   },
    // },
    // { // GhostChat project
    //   id: "ghostchat",
    //   category: "Anonymous chat",
    //   title: "GhostChat",
    //   src: "/assets/projects-screenshots/ghostchat/1.png",
    //   screenshots: ["1.png", "2.png", "3.png", "4.png"],
    //   live: "https://ghostchat.vercel.app",
    //   github:"https://github.com/Naresh-Khatri/GhostChat",
    //   skills: {
    //     frontend: [PROJECT_SKILLS.js, PROJECT_SKILLS.next, PROJECT_SKILLS.chakra],
    //     backend: [PROJECT_SKILLS.supabase],
    //   },
    //   get content() {
    //     return (
    //       <div>
    //         <TypographyP className="font-mono ">
    //           Ghostchat is your go-to spot for sending anonymous messages without
    //           leaving a trace. Powered by Supabase, it&apos;s all about keeping things
    //           low-key and secure. Whether you&apos;re sharing secrets, giving feedback,
    //           or just having some fun, Ghostchat ensures your identity stays
    //           hidden, while your voice is heard. Say what you want, without the
    //           worry.
    //         </TypographyP>
    //         <ProjectsLinks live={this.live} repo={this.github} />
    //         <SlideShow
    //           images={[
    //             `${BASE_PATH}/ghostchat/1.png`,
    //             `${BASE_PATH}/ghostchat/2.png`,
    //             `${BASE_PATH}/ghostchat/3.png`,
    //             `${BASE_PATH}/ghostchat/4.png`,
    //           ]}
    //         />
    //       </div>
    //     );
    //   },
    // },
    // {
    //   id: "jra",
    //   category: "Result analyzer",
    //   title: "JNTUA Results Analyzer",
    //   src: "/assets/projects-screenshots/jra/1.png",
    //   screenshots: ["1.png"],
    //   live: "https://naresh-khatri.github.io/JNTUA-result-analyser-spa/#/",
    //   skills: {
    //     frontend: [PROJECT_SKILLS.js, PROJECT_SKILLS.vue],
    //     backend: [
    //       PROJECT_SKILLS.node,
    //       PROJECT_SKILLS.mongo,
    //       PROJECT_SKILLS.express,
    //       PROJECT_SKILLS.docker,
    //     ],
    //   },
    //   get content() {
    //     return (
    //       <div>
    //         <TypographyP className="font-mono ">
    //           JNTUA Results Analyzer was a revolutionary tool designed to simplify
    //           and enhance the experience of accessing academic results. It served
    //           as a powerful proxy between the JNTUA university results website and
    //           its users, offering a range of features that made result analysis
    //           faster and more efficient. Here&apos;s what made it stand out:
    //         </TypographyP>
    //         <ProjectsLinks live={this.live} repo={this.github} />
    //         <SlideShow images={[`${BASE_PATH}/jra/1.png`]} />
    //         <TypographyH3 className="my-4 mt-8">
    //           Effortless Results Retrieval
    //         </TypographyH3>
    //         {/* Effortless Results Retrieval: */}
    //         <ul className="list-disc ml-6">
    //           <li className="font-mono">
    //             Search all your results using a single roll number, eliminating
    //             the tedious task of sifting through thousands of rows on the
    //             official site.
    //           </li>
    //         </ul>
    //         <TypographyH3 className="my-4 mt-8">Class-Wise Results:</TypographyH3>
    //         <ul className="list-disc ml-6">
    //           <li className="font-mono">
    //             class-wise results effortlessly by entering a roll number range.
    //             No more manual searches or filtering.
    //           </li>
    //         </ul>
    //         <TypographyH3 className="my-4 mt-8">Faculty Features:</TypographyH3>
    //         <ul className="list-disc ml-6">
    //           <li className="font-mono">
    //             Faculty members could download batch results in Excel format,
    //             making administrative tasks a breeze.
    //           </li>
    //         </ul>
    //         <TypographyH3 className="my-4 mt-8">
    //           Enhanced Data Insights:
    //         </TypographyH3>
    //         <ul className="list-disc ml-6">
    //           <li className="font-mono">
    //             Each result came with additional features including:
    //             <ul className="list-disc font-mono ml-6">
    //               <li>
    //                 <strong>CGPA Calculations: </strong>Easily track your
    //                 cumulative grade point average.
    //               </li>
    //               <li>
    //                 <strong>Charts:</strong> Visualize your academic performance
    //                 with comprehensive charts.
    //               </li>
    //               <li>
    //                 <strong>Future Projections:</strong> Get insights into
    //                 potential future outcomes based on current performance.
    //               </li>
    //               <li>
    //                 <strong> Backlog Counts: </strong>Keep track of your backlog
    //                 subjects at a glance.
    //               </li>
    //             </ul>
    //           </li>
    //         </ul>
    //         <TypographyH3 className="my-4 mt-8">Performance:</TypographyH3>
    //         <ul className="list-disc ml-6">
    //           <li className="font-mono">
    //             The application was significantly faster and more efficient than
    //             the official site, providing a smoother user experience.
    //           </li>
    //         </ul>
    //         <TypographyH3 className="my-4 mt-8">Downfall:</TypographyH3>
    //         <ul className="list-disc ml-6">
    //           <li className="font-mono">
    //             Unfortunately, as of May 2022, the tool stopped working due to the
    //             introduction of CAPTCHA on the official JNTUA results site, which
    //             disrupted the seamless functionality of the app. JNTUA Results
    //             Analyzer transformed the way students and faculty interacted with
    //             academic results, making it a must-have tool until its unexpected
    //             shutdown.
    //           </li>
    //         </ul>
    //       </div>
    //     );
    //   },
    // },
    // +
    {
        id: "aidockerfileoptimizer",
        category: "AI และ DevOps",
        title: "AI Dockerfile Optimizer",
        src: "/assets/projects-screenshots/aidockerfileoptimizer/2.png",
        screenshots: ["1.png", "2.png", "3.png"],
        live: "https://ai-docker-file-optimizer.netlify.app/",
        github: "https://github.com/Abhiz2411/AI-Docker-file-optimizer",
        skills: {
            frontend: [PROJECT_SKILLS.js, PROJECT_SKILLS.next, PROJECT_SKILLS.tailwind, PROJECT_SKILLS.vite],
            backend: [PROJECT_SKILLS.openai, PROJECT_SKILLS.netlify],
        },
        get content() {
            return (<div>
          <typography_1.TypographyP className="font-mono ">
            AI-Docker-file-optimizer helps optimize Dockerfiles for smaller, more efficient images. 
            Simply paste your Dockerfile, and the app analyzes it for best practices and size 
            optimization tips. It then provides a refactored, optimized version of the Dockerfile. 
            Deployed on Vercel, it ensures fast and easy access to Dockerfile optimization.
          </typography_1.TypographyP>
          <ProjectsLinks live={this.live} repo={this.github}/>
          <slide_show_1.default images={[
                    `${BASE_PATH}/aidockerfileoptimizer/1.png`,
                    `${BASE_PATH}/aidockerfileoptimizer/2.png`,
                    `${BASE_PATH}/aidockerfileoptimizer/3.png`,
                ]}/>
        </div>);
        },
    },
    {
        id: "financeme",
        category: "DevOps ในธนาคารและการเงิน",
        title: "FinanceMe: Complete DevOps Capstone Project",
        src: "/assets/projects-screenshots/financeme/1.png",
        screenshots: ["/assets/projects-screenshots/financeme/1.png"],
        skills: {
            frontend: [
                PROJECT_SKILLS.html,
                PROJECT_SKILLS.css,
                PROJECT_SKILLS.js,
                PROJECT_SKILLS.bootstrap,
            ],
            backend: [
                PROJECT_SKILLS.java,
                PROJECT_SKILLS.maven,
                PROJECT_SKILLS.postgres,
            ],
        },
        live: "https://github.com/Abhiz2411/FinanceMe-Devops-Project-01",
        github: "https://github.com/Abhiz2411/FinanceMe-Devops-Project-01",
        get content() {
            return (<div>
          <typography_1.TypographyP className="font-mono text-2xl text-center">
            FinanceMe: Complete DevOps Capstone Project
          </typography_1.TypographyP>
          <typography_1.TypographyP className="font-mono ">
            This project demonstrates the deployment of a DevOps pipeline for a global banking and
            financial services provider, FinanceMe. The company transitioned from a monolithic 
            architecture to a microservice-based architecture to handle increased traffic and 
            scaling challenges. The project involves automating infrastructure provisioning, build 
            and deployment processes, and continuous monitoring using modern DevOps tools and 
            AWS services.?
          </typography_1.TypographyP>
          <ProjectsLinks live={this.live} repo={this.github}/>
          <typography_1.TypographyH3 className="my-4 mt-8">Architecture </typography_1.TypographyH3>
          <p className="font-mono mb-2">
            The project is divided into three main phases:
            1.Automating Infrastructure Provisioning
            2.Build and Deployment Automation
            3.Continuous Monitoring
          </p>
          <slide_show_1.default images={[
                    `${BASE_PATH}/financeme/1.png`,
                    `${BASE_PATH}/financeme/2.png`,
                ]}/>
          <typography_1.TypographyH3 className="my-4 mt-8">Automating Infrastructure Provisioning</typography_1.TypographyH3>
          <p className="font-mono mb-2">
          Terraform is used to create 4 AWS EC2 instances:
            Jenkins Master Node (for CI/CD pipeline management)
            Build Server (for application and Docker image builds)
            Production Server (for deploying Dockerized applications)
            Monitoring Server (for continuous monitoring of Build and Prod servers)
          </p>
          <slide_show_1.default images={[
                    `${BASE_PATH}/financeme/4_A.png`,
                    `${BASE_PATH}/financeme/4.png`,
                ]}/>
          <typography_1.TypographyH3 className="my-4 mt-8">Build and Deployment Automation</typography_1.TypographyH3>

          <p className="font-mono mb-2">
          Jenkins is configured for a CI/CD pipeline:
            Jenkins Master Node is responsible for pipeline orchestration.
            Build Server is configured as a Jenkins Slave Node to handle application builds and Docker image creation.
            Ansible is used for automating deployment to the Prod server, where the application is deployed using an Ansible client-server model.
          </p>
          <slide_show_1.default images={[
                    `${BASE_PATH}/financeme/5.png`,
                    `${BASE_PATH}/financeme/6.png`,
                    `${BASE_PATH}/financeme/7.png`,
                ]}/>
          <typography_1.TypographyH3 className="my-4 mt-8">Continuous Monitoring </typography_1.TypographyH3>
          <p className="font-mono mb-2">
          Prometheus and Grafana are used for real-time monitoring:
            Node Exporter is installed on both Build and Prod servers to collect server metrics (CPU, Disk Space, Memory Utilization).
            Grafana Dashboard is created to visualize these metrics for continuous monitoring.
          </p>
          <slide_show_1.default images={[
                    `${BASE_PATH}/financeme/3.png`,
                    `${BASE_PATH}/financeme/8.png`,
                    `${BASE_PATH}/financeme/9.png`,
                    `${BASE_PATH}/financeme/10.png`,
                ]}/>
        </div>);
        },
    },
    {
        id: "comdee",
        category: "ระบบกล้องวงจรปิดและเครือข่าย",
        title: "COMDEE - ระบบกล้องวงจรปิดและเครือข่าย",
        src: "/assets/projects-screenshots/comdee/comdee-main.png",
        screenshots: ["comdee-main.png", "comdee-services.png", "comdee-contact.png"],
        live: "https://www.comdee.co.th",
        skills: {
            frontend: [
                PROJECT_SKILLS.html,
                PROJECT_SKILLS.css,
                PROJECT_SKILLS.js,
                PROJECT_SKILLS.bootstrap,
            ],
            backend: [],
        },
        get content() {
            return (<div>
          <typography_1.TypographyP className="font-mono text-2xl text-center">
            COMDEE - ผู้เชี่ยวชาญด้านระบบกล้องวงจรปิดและเครือข่าย
          </typography_1.TypographyP>
          <typography_1.TypographyP className="font-mono ">
            บริษัท COMDEE เป็นผู้เชี่ยวชาญในการติดตั้งและบริการระบบกล้องวงจรปิด (CCTV) 
            ระบบเครือข่าย ระบบไฟฟ้า และระบบใยแก้วนำแสง มีประสบการณ์มากกว่า 10 ปี 
            ในการให้บริการลูกค้าทั้งภาคเอกชนและรัฐบาล พร้อมทีมงานมืออาชีพและเทคโนโลยีที่ทันสมัย
          </typography_1.TypographyP>
          <ProjectsLinks live={this.live}/>
          <typography_1.TypographyH3 className="my-4 mt-8">บริการหลัก</typography_1.TypographyH3>
          <p className="font-mono mb-2">
            • ระบบกล้องวงจรปิด (CCTV) - ติดตั้งและบำรุงรักษาระบบกล้องวงจรปิดคุณภาพสูง<br />
            • ระบบเครือข่าย (Network) - ออกแบบและติดตั้งระบบเครือข่ายองค์กร<br />
            • ระบบไฟฟ้า (Electrical) - งานระบบไฟฟ้าและควบคุมอัตโนมัติ<br />
            • ระบบใยแก้วนำแสง (Fiber Optic) - ติดตั้งและเชื่อมต่อสายใยแก้วนำแสง
          </p>
          <slide_show_1.default images={[
                    `${BASE_PATH}/comdee/comdee-main.png`,
                    `${BASE_PATH}/comdee/comdee-services.png`,
                ]}/>
          <typography_1.TypographyH3 className="my-4 mt-8">ผลงานที่โดดเด่น</typography_1.TypographyH3>
          <p className="font-mono mb-2">
            • โครงการติดตั้งระบบกล้องวงจรปิดมากกว่า 500+ โครงการ<br />
            • ประสบการณ์การทำงานมากกว่า 10 ปี<br />
            • ลูกค้าที่ไว้วางใจมากกว่า 1,000+ ราย<br />
            • ครอบคลุมพื้นที่บริการทั่วประเทศไทย
          </p>
          <slide_show_1.default images={[
                    `${BASE_PATH}/comdee/comdee-contact.png`,
                ]}/>
          <typography_1.TypographyH3 className="my-4 mt-8">จุดเด่นของบริการ</typography_1.TypographyH3>
          <p className="font-mono mb-2">
            • ทีมงานมืออาชีพและมีประสบการณ์สูง<br />
            • ใช้อุปกรณ์และเทคโนโลยีที่ทันสมัย<br />
            • บริการหลังการขายและการบำรุงรักษาที่ครบครัน<br />
            • ราคาที่เหมาะสมและโปร่งใส<br />
            • รับประกันคุณภาพงานและอุปกรณ์
          </p>
          <p className="font-mono mb-2 mt-5">
            COMDEE มุ่งมั่นในการให้บริการที่มีคุณภาพสูงสุด เพื่อความปลอดภัยและความมั่นใจของลูกค้า 
            ด้วยเทคโนโลยีที่ทันสมัยและทีมงานที่เชี่ยวชาญ
          </p>
        </div>);
        },
    },
    {
        id: "portfolio",
        category: "พอร์ตโฟลิโอ",
        title: "My Portfolio",
        src: "/assets/projects-screenshots/myportfolio/landing.png",
        screenshots: ["assets/projects-screenshots/myportfolio/landing.png"],
        live: "https://www.abhijitzende.com/",
        github: "https://github.com/Abhiz2411/3D-interactive-portfolio",
        skills: {
            frontend: [
                PROJECT_SKILLS.ts,
                PROJECT_SKILLS.next,
                PROJECT_SKILLS.shadcn,
                PROJECT_SKILLS.aceternity,
                PROJECT_SKILLS.framerMotion,
                PROJECT_SKILLS.tailwind,
                PROJECT_SKILLS.spline,
            ],
            backend: [],
        },
        get content() {
            return (<div>
          <typography_1.TypographyP className="font-mono ">
            ยินดีต้อนรับสู่สนามเด็กเล่นดิจิทัลของฉัน ที่ความคิดสร้างสรรค์ผสานกับโค้ดในแบบที่เจ๋งที่สุด
          </typography_1.TypographyP>
          <ProjectsLinks live={this.live} repo={this.github}/>
          <typography_1.TypographyH3 className="my-4 mt-8">
            วัตถุ 3D ที่สวยงาม{" "}
          </typography_1.TypographyH3>
          <p className="font-mono mb-2">
            เห็นคีย์บอร์ด 3D นั่นไหม? ใช่! ฉันทำเอง คีย์บอร์ดแบบโต้ตอบนั้นถูกเรนเดอร์เป็น 3D บนหน้าเว็บ 🤯 
            และการกดแต่ละปุ่มจะเผยให้เห็นทักษะในแบบที่สนุกสนาน เหมือนการพิมพ์ แต่ทำให้เป็นศิลปะ
          </p>
          <slide_show_1.default images={[
                    `${BASE_PATH}/myportfolio/landing.png`,
                    `${BASE_PATH}/portfolio/skills.png`,
                ]}/>
          <typography_1.TypographyH3 className="my-4 ">ธีมอวกาศ</typography_1.TypographyH3>
          <p className="font-mono mb-2">
            พื้นหลังมืด + อนุภาคลอยน้ำ = ความเจ๋งที่เหนือโลก
          </p>
          <slide_show_1.default images={[`${BASE_PATH}/myportfolio/navbar.png`]}/>
          <typography_1.TypographyH3 className="my-4 mt-8">ผลงาน</typography_1.TypographyH3>

          <p className="font-mono mb-2">
            โปรเจกต์ส่วนตัวและฟรีแลนซ์ชั้นนำของฉัน — ไม่มีของเติม ทั้งหมดเป็นของจริง
          </p>
          <slide_show_1.default images={[
                    `${BASE_PATH}/myportfolio/projects.png`,
                    `${BASE_PATH}/myportfolio/project.png`,
                ]}/>
          <p className="font-mono mb-2 mt-8 text-center">
            เว็บไซต์นี้ไม่ใช่แค่พอร์ตโฟลิโอ — มันคือบรรยากาศทั้งหมด
          </p>
        </div>);
        },
    },
    {
        id: "smartparkingassitant",
        category: "อินเทอร์เน็ตของสิ่งของ (IoT)",
        title: "Smart Parking Assistant",
        src: "/assets/projects-screenshots/smartparkingassitant/01.jpeg",
        screenshots: ["01.jpeg", "03.png"],
        live: "https://github.com/Abhiz2411/smart-parking-assistant",
        github: "https://github.com/Abhiz2411/smart-parking-assistant",
        skills: {
            frontend: [PROJECT_SKILLS.python],
            backend: [PROJECT_SKILLS.cplusplus, PROJECT_SKILLS.arduino],
        },
        get content() {
            return (<div>
          <typography_1.TypographyP className="font-mono ">
            Transform parking with the Smart Parking Assistant, an IoT marvel powered by Arduino 
            and IR sensors to detect and recommend the best spots in real-time. Enjoy a sleek GUI 
            that visualizes availability and an intelligent system for quick, optimal decisions. 
            Built to adapt with customizable hardware and Python-powered software for seamless 
            integration. Say goodbye to parking woes and hello to smarter space utilization!
          </typography_1.TypographyP>
          <ProjectsLinks live={this.live} repo={this.github}/>
          <slide_show_1.default images={[
                    `${BASE_PATH}/smartparkingassitant/01.jpeg`,
                    `${BASE_PATH}/smartparkingassitant/03.png`,
                    `${BASE_PATH}/smartparkingassitant/04.jpg`,
                ]}/>
        </div>);
        },
    },
    {
        id: "smartjobtracker",
        category: "Full Stack",
        title: "Smart Job Tracker",
        src: "/assets/projects-screenshots/smartjobtracker/02.png",
        screenshots: ["01.png", "02.png", "03.png", "04.png", "05.png", "06.png", "07.png"],
        live: "https://job-tracker-application-eight.vercel.app/",
        github: "https://github.com/Abhiz2411/Job-tracker-application",
        skills: {
            frontend: [PROJECT_SKILLS.js, PROJECT_SKILLS.next, PROJECT_SKILLS.tailwind, PROJECT_SKILLS.vite],
            backend: [PROJECT_SKILLS.firebase],
        },
        get content() {
            return (<div>
          <typography_1.TypographyP className="font-mono ">
            Track your job applications effortlessly with a sleek, dark-themed app that lets you 
            manage, filter, and visualize your job search. Organize your applications with a 
            Kanban board, monitor progress through status updates, and store everything securely. 
            Enjoy seamless access across devices with a responsive design and email reminders for 
            interviews. A smarter, more intuitive way to stay on top of your job hunt!
          </typography_1.TypographyP>
          <ProjectsLinks live={this.live} repo={this.github}/>
          <slide_show_1.default images={[
                    `${BASE_PATH}/smartjobtracker/01.png`,
                    `${BASE_PATH}/smartjobtracker/02.png`,
                    `${BASE_PATH}/smartjobtracker/03.png`,
                    `${BASE_PATH}/smartjobtracker/04.png`,
                    `${BASE_PATH}/smartjobtracker/05.png`,
                    `${BASE_PATH}/smartjobtracker/06.png`,
                    `${BASE_PATH}/smartjobtracker/07.png`,
                ]}/>
        </div>);
        },
    },
    {
        id: "savinderpurisportfolio",
        category: "การพัฒนาเว็บไซต์",
        title: "Savinder Puri Portfolio",
        src: "/assets/projects-screenshots/savinderpuriportfolio/01.png",
        screenshots: ["01.png", "02.png", "03.png", "04.png", "05.png"],
        live: "https://savinder-puri.vercel.app/",
        github: "https://github.com/Abhiz2411/savinder-puri",
        skills: {
            frontend: [PROJECT_SKILLS.js, PROJECT_SKILLS.next, PROJECT_SKILLS.tailwind, PROJECT_SKILLS.vite],
            backend: [],
        },
        get content() {
            return (<div>
          <typography_1.TypographyP className="font-mono ">
            Step into the digital world of Savinder Puri, the beloved DevOps guru and Spiritual 
            Alchemist, with this responsive portfolio website. 🌐✨ Explore his inspiring journey, 
            milestones, and life-changing services blending tech and spirituality. Built with 
            modern tools like React and TypeScript, it’s a heartfelt tribute to a mentor who 
            transforms lives. 💻🕊️ Crafted with ❤️ by Abhijit Zende! 🚀
          </typography_1.TypographyP>
          <ProjectsLinks live={this.live} repo={this.github}/>
          <slide_show_1.default images={[
                    `${BASE_PATH}/savinderpuriportfolio/01.png`,
                    `${BASE_PATH}/savinderpuriportfolio/02.png`,
                    `${BASE_PATH}/savinderpuriportfolio/03.png`,
                    `${BASE_PATH}/savinderpuriportfolio/04.png`,
                    `${BASE_PATH}/savinderpuriportfolio/05.png`,
                ]}/>
        </div>);
        },
    },
];
exports.default = projects;
//# sourceMappingURL=projects.js.map