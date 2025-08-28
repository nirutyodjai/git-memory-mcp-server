export interface EmailTemplateData {
    id: string;
    name: string;
    subject: string;
    category: 'newsletter' | 'marketing' | 'transactional' | 'welcome' | 'notification';
    htmlContent: string;
    textContent?: string;
    variables: string[];
    preview?: string;
}
export declare const EMAIL_TEMPLATES: EmailTemplateData[];
export declare function getTemplate(id: string): EmailTemplateData | undefined;
export declare function getTemplatesByCategory(category: EmailTemplateData['category']): EmailTemplateData[];
export declare function getAllTemplates(): EmailTemplateData[];
//# sourceMappingURL=templates.d.ts.map