export declare enum SkillNames {
    AWS = "aws",
    LINUX = "linux",
    GIT = "git",
    DOCKER = "docker",
    HTML = "html",
    CSS = "css",
    JS = "js",
    POSTGRES = "postgres",
    TS = "ts",//
    REACT = "react",//
    VUE = "vue",//
    NEXTJS = "nextjs",//
    TAILWIND = "tailwind",//
    NODEJS = "nodejs",//
    EXPRESS = "express",// 
    MONGODB = "mongodb",//
    GITHUB = "github",//
    PRETTIER = "prettier",//
    NPM = "npm",//
    FIREBASE = "firebase",//
    WORDPRESS = "wordpress",//
    NGINX = "nginx",//
    VIM = "vim",//
    VERCEL = "vercel"
}
export type Skill = {
    id: number;
    name: string;
    label: string;
    shortDescription: string;
    color: string;
    icon: string;
};
export declare const SKILLS: Record<SkillNames, Skill>;
export declare const themeDisclaimers: {
    light: string[];
    dark: string[];
};
//# sourceMappingURL=constants.d.ts.map