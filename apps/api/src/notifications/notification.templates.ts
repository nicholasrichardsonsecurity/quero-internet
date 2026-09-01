export const NOTIFICATION_TEMPLATES = [
  { code: 'APPLICATION_STATUS_UPDATED', version: 1, purpose: 'application_status', channels: ['EMAIL', 'SMS', 'WHATSAPP'] as const, text: 'Atualização sobre sua solicitação no programa de conectividade.' },
  { code: 'INSTALLATION_SCHEDULED', version: 1, purpose: 'installation_status', channels: ['EMAIL', 'SMS', 'WHATSAPP'] as const, text: 'Sua instalação foi agendada. Consulte os detalhes no canal oficial.' },
  { code: 'SERVICE_STATUS_UPDATED', version: 1, purpose: 'service_status', channels: ['EMAIL', 'SMS', 'WHATSAPP'] as const, text: 'Houve uma atualização no status do seu serviço.' }
] as const;

export type NotificationTemplate = (typeof NOTIFICATION_TEMPLATES)[number];
