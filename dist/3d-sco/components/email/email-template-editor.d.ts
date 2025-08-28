import { EmailTemplate } from '../../lib/email/email-service';
interface EmailTemplateEditorProps {
    template?: EmailTemplate;
    onSave?: (template: Partial<EmailTemplate>) => void;
    onPreview?: (html: string) => void;
    className?: string;
}
export declare function EmailTemplateEditor({ template, onSave, onPreview, className, }: EmailTemplateEditorProps): any;
export {};
//# sourceMappingURL=email-template-editor.d.ts.map