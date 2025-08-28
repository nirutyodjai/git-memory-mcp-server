import { Link as LinkType } from "@/types";
interface SelectedLink {
    isActive: boolean;
    index: number;
}
interface BodyProps {
    links: LinkType[];
    selectedLink: SelectedLink;
    setSelectedLink: (selectedLink: SelectedLink) => void;
    setIsActive: (isActive: boolean) => void;
}
export default function Body({ links, selectedLink, setSelectedLink, setIsActive, }: BodyProps): any;
export {};
//# sourceMappingURL=body.d.ts.map