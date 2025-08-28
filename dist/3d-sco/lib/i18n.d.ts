export declare const supportedLanguages: {
    th: {
        name: string;
        nativeName: string;
        flag: string;
        dir: string;
    };
    en: {
        name: string;
        nativeName: string;
        flag: string;
        dir: string;
    };
    ja: {
        name: string;
        nativeName: string;
        flag: string;
        dir: string;
    };
    ko: {
        name: string;
        nativeName: string;
        flag: string;
        dir: string;
    };
    zh: {
        name: string;
        nativeName: string;
        flag: string;
        dir: string;
    };
};
export declare const defaultLanguage = "th";
export declare const fallbackLanguage = "en";
export declare const i18n: any;
export declare const getCurrentLanguage: () => any;
export declare const changeLanguage: (lng: string) => any;
export declare const isRTL: (lng?: string) => boolean;
export declare const formatDate: (date: Date | string, lng?: string) => string;
export declare const formatNumber: (number: number, lng?: string) => string;
export declare const formatCurrency: (amount: number, currency?: string, lng?: string) => string;
export type TranslationKeys = {
    common: {
        loading: string;
        error: string;
        success: string;
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        view: string;
        back: string;
        next: string;
        previous: string;
        search: string;
        filter: string;
        sort: string;
        clear: string;
        submit: string;
        close: string;
        open: string;
        yes: string;
        no: string;
        ok: string;
        confirm: string;
        warning: string;
        info: string;
        required: string;
        optional: string;
        selectAll: string;
        deselectAll: string;
        noData: string;
        comingSoon: string;
    };
    navigation: {
        home: string;
        about: string;
        projects: string;
        blog: string;
        contact: string;
        admin: string;
        login: string;
        logout: string;
        profile: string;
        settings: string;
        dashboard: string;
    };
    home: {
        hero: {
            title: string;
            subtitle: string;
            description: string;
            cta: string;
            learnMore: string;
        };
        features: {
            title: string;
            subtitle: string;
        };
        testimonials: {
            title: string;
            subtitle: string;
        };
        cta: {
            title: string;
            subtitle: string;
            button: string;
        };
    };
    about: {
        title: string;
        subtitle: string;
        description: string;
        skills: {
            title: string;
            subtitle: string;
        };
        experience: {
            title: string;
            subtitle: string;
        };
        education: {
            title: string;
            subtitle: string;
        };
    };
    projects: {
        title: string;
        subtitle: string;
        categories: {
            all: string;
            web: string;
            mobile: string;
            desktop: string;
            '3d': string;
        };
        status: {
            planning: string;
            inProgress: string;
            completed: string;
            onHold: string;
        };
        details: {
            client: string;
            duration: string;
            technologies: string;
            category: string;
            status: string;
            budget: string;
            team: string;
            description: string;
            features: string;
            challenges: string;
            results: string;
            gallery: string;
            relatedProjects: string;
        };
    };
    blog: {
        title: string;
        subtitle: string;
        readMore: string;
        readTime: string;
        publishedOn: string;
        author: string;
        category: string;
        tags: string;
        relatedPosts: string;
        comments: string;
        share: string;
        newsletter: {
            title: string;
            subtitle: string;
            placeholder: string;
            button: string;
            success: string;
            error: string;
        };
    };
    contact: {
        title: string;
        subtitle: string;
        form: {
            name: string;
            email: string;
            subject: string;
            message: string;
            send: string;
            sending: string;
            success: string;
            error: string;
        };
        info: {
            address: string;
            phone: string;
            email: string;
            social: string;
        };
    };
    admin: {
        dashboard: {
            title: string;
            welcome: string;
            stats: {
                projects: string;
                blogPosts: string;
                subscribers: string;
                uploads: string;
            };
        };
        projects: {
            title: string;
            create: string;
            edit: string;
            delete: string;
            status: string;
            category: string;
        };
        blog: {
            title: string;
            create: string;
            edit: string;
            delete: string;
            publish: string;
            draft: string;
            categories: string;
            tags: string;
        };
        uploads: {
            title: string;
            upload: string;
            delete: string;
            manage: string;
        };
        backup: {
            title: string;
            create: string;
            restore: string;
            download: string;
            schedule: string;
        };
        settings: {
            title: string;
            general: string;
            security: string;
            notifications: string;
            language: string;
            theme: string;
        };
    };
};
export default i18n;
//# sourceMappingURL=i18n.d.ts.map