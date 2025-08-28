interface NewsletterSubscriptionProps {
    className?: string;
    variant?: 'default' | 'minimal' | 'card';
    showDescription?: boolean;
    onSubscribe?: (email: string, firstName?: string, lastName?: string) => Promise<void>;
}
export declare function NewsletterSubscription({ className, variant, showDescription, onSubscribe, }: NewsletterSubscriptionProps): any;
export {};
//# sourceMappingURL=newsletter-subscription.d.ts.map