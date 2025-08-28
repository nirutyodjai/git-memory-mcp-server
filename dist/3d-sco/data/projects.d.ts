import { ReactNode } from "react";
export type Skill = {
    title: string;
    bg: string;
    fg: string;
    icon: ReactNode;
};
export type Project = {
    id: string;
    category: string;
    title: string;
    src: string;
    screenshots: string[];
    skills: {
        frontend: Skill[];
        backend: Skill[];
    };
    content: React.ReactNode | any;
    github?: string;
    live: string;
};
declare const projects: Project[];
export default projects;
//# sourceMappingURL=projects.d.ts.map