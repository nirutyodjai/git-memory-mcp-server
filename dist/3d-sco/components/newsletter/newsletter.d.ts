interface NewsletterProps {
    title?: string;
    description?: string;
    placeholder?: string;
    buttonText?: string;
    className?: string;
    variant?: 'default' | 'minimal' | 'card' | 'inline';
}
export declare function Newsletter({ title, description, placeholder, buttonText, className, variant }: NewsletterProps): any;
interface NewsletterPopupProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
}
export declare function NewsletterPopup({ isOpen, onClose, title, description }: NewsletterPopupProps): any;
export declare function NewsletterBanner({ onDismiss }: {
    onDismiss?: () => void;
}): any;
export default Newsletter;
//# sourceMappingURL=newsletter.d.ts.map