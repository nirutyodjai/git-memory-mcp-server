import { EmailCampaign } from '../../lib/email/email-service';
interface EmailCampaignManagerProps {
    className?: string;
    onCreateCampaign?: () => void;
    onEditCampaign?: (campaign: EmailCampaign) => void;
    onDeleteCampaign?: (campaignId: string) => void;
    onSendCampaign?: (campaignId: string) => void;
    onPauseCampaign?: (campaignId: string) => void;
    onResumeCampaign?: (campaignId: string) => void;
}
export declare function EmailCampaignManager({ className, onCreateCampaign, onEditCampaign, onDeleteCampaign, onSendCampaign, onPauseCampaign, onResumeCampaign, }: EmailCampaignManagerProps): any;
export {};
//# sourceMappingURL=email-campaign-manager.d.ts.map