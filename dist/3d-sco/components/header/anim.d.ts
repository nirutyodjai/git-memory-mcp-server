export declare const opacity: {
    initial: {
        opacity: number;
    };
    open: {
        opacity: number;
        transition: {
            duration: number;
        };
    };
    closed: {
        opacity: number;
        transition: {
            duration: number;
        };
    };
};
export declare const height: {
    initial: {
        height: number;
    };
    enter: {
        height: string;
        transition: {
            duration: number;
            ease: number[];
        };
    };
    exit: {
        height: number;
        transition: {
            duration: number;
            ease: number[];
        };
    };
};
export declare const background: {
    initial: {
        height: number;
    };
    open: {
        height: string;
        transition: {
            duration: number;
            ease: number[];
        };
    };
    closed: {
        height: number;
        transition: {
            duration: number;
            ease: number[];
        };
    };
};
export declare const blur: {
    initial: {
        filter: string;
        opacity: number;
    };
    open: {
        filter: string;
        opacity: number;
        transition: {
            duration: number;
        };
    };
    closed: {
        filter: string;
        opacity: number;
        transition: {
            duration: number;
        };
    };
};
export declare const translate: {
    initial: {
        y: string;
        opacity: number;
    };
    enter: (i: any[]) => {
        y: number;
        opacity: number;
        transition: {
            duration: number;
            ease: number[];
            delay: any;
        };
    };
    exit: (i: any[]) => {
        y: string;
        opacity: number;
        transition: {
            duration: number;
            ease: number[];
            delay: any;
        };
    };
};
//# sourceMappingURL=anim.d.ts.map