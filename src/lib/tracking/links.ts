import { brand } from '@/lib/brand';

const BASE = brand.url;

/**
 * Links de campanha — edite aqui para atualizar todos os links do sistema.
 *
 * Estrutura da URL:
 *   utm_source  = canal principal  (instagram, facebook, whatsapp, google)
 *   utm_medium  = formato/local    (bio, stories, post, status, cpc)
 *   utm_campaign = intenção         (upgrade, vendas, gamer) — opcional
 *
 * O que acontece quando alguém acessa um desses links:
 *   1. O site salva o utm_source na sessão (sessionStorage)
 *   2. Ao preencher o formulário OU clicar no WhatsApp, o lead é criado
 *   3. O marketing_source salvo no banco será o valor mapeado abaixo:
 *      instagram → "instagram_dm" | facebook → "facebook_dm"
 *      google → "google_ads"      | outros  → "organic"
 *   4. Na hora de fechar a comissão no admin, o sistema detecta
 *      automaticamente o canal e aplica 8% (ou 5% acima de R$8.000)
 */
export const campaignLinks = {
    instagram_bio: `${BASE}?utm_source=instagram&utm_medium=bio`,
    instagram_stories: `${BASE}?utm_source=instagram&utm_medium=stories`,
    instagram_post: `${BASE}?utm_source=instagram&utm_medium=post`,
    facebook_post: `${BASE}?utm_source=facebook&utm_medium=post`,
    whatsapp_status: `${BASE}?utm_source=whatsapp&utm_medium=status`,
    google_ads: `${BASE}?utm_source=google&utm_medium=cpc`,
    direto: BASE,
} as const;

export type CampaignChannel = keyof typeof campaignLinks;

export const channelMeta: Record<CampaignChannel, {
    label: string;
    emoji: string;
    /** Valor que aparece em leads.marketing_source no banco */
    dbSource: string;
    /** Taxa de comissão aplicada automaticamente */
    commissionRate: string;
}> = {
    instagram_bio:     { label: 'Instagram — Bio',     emoji: '📸', dbSource: 'instagram_dm', commissionRate: '8%' },
    instagram_stories: { label: 'Instagram — Stories', emoji: '📱', dbSource: 'instagram_dm', commissionRate: '8%' },
    instagram_post:    { label: 'Instagram — Post',    emoji: '🖼️', dbSource: 'instagram_dm', commissionRate: '8%' },
    facebook_post:     { label: 'Facebook — Post',     emoji: '👥', dbSource: 'facebook_dm',  commissionRate: '8%' },
    whatsapp_status:   { label: 'WhatsApp — Status',   emoji: '💬', dbSource: 'organic',       commissionRate: '8%' },
    google_ads:        { label: 'Google Ads',           emoji: '🔍', dbSource: 'google_ads',   commissionRate: '8%' },
    direto:            { label: 'Link Direto',          emoji: '🔗', dbSource: 'direct',        commissionRate: '8%' },
};
