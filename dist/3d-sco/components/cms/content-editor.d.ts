import { Content } from '@/lib/cms/client';
interface ContentEditorProps {
    contentId?: string;
    onSave?: (content: Content) => void;
    onCancel?: () => void;
    className?: string;
}
export declare function ContentEditor({ contentId, onSave, onCancel, className }: ContentEditorProps): any;
export default ContentEditor;
//# sourceMappingURL=content-editor.d.ts.map