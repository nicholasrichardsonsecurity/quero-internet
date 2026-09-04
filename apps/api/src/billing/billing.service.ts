import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { isBillingEventName, parseBillingReference, type AsaasWebhookPayload } from './billing.types';
type AcceptedWebhook={status:'accepted';eventId:string;paymentId:string;duplicate:boolean;processing:'recorded_for_reconciliation'};
@Injectable()
export class BillingService {
  constructor(private readonly prisma:PrismaService) {}
  async receiveAsaasWebhook(accessToken:string|undefined,payload:AsaasWebhookPayload):Promise<AcceptedWebhook> {
    const expectedToken=process.env.ASAAS_WEBHOOK_TOKEN?.trim();
    if(!expectedToken || !accessToken || accessToken!==expectedToken) throw new UnauthorizedException('Webhook Asaas não autorizado.');
    const eventId=this.stringValue(payload.id);
    const event=payload.event;
    const paymentId=this.stringValue(payload.payment?.id);
    const paymentStatus=this.stringValue(payload.payment?.status);
    const externalReference=payload.payment?.externalReference;
    const reference=parseBillingReference(externalReference);
    if(!eventId || !isBillingEventName(event) || !paymentId || !reference || reference.paymentId!==paymentId) throw new BadRequestException('Payload Asaas inválido ou externalReference incompatível.');
    const payloadHash=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const existing=await this.prisma.billingWebhookEvent.findUnique({where:{eventId}});
    if(existing) return {status:'accepted',eventId,paymentId,duplicate:true,processing:'recorded_for_reconciliation'};
    try {
      await this.prisma.$transaction(async(tx)=>{
        await tx.billingWebhookEvent.create({data:{eventId,eventName:event,paymentId,paymentStatus,productKey:reference.productKey,tenantId:reference.tenantId,companyId:reference.companyId,planId:reference.planId,externalReference:externalReference as string,environment:this.environment(),payloadHash,payload:JSON.stringify(payload),processingStatus:this.normalizePaymentState(event,paymentStatus),receivedAt:new Date()}});
        await tx.billingAuditEntry.create({data:{eventId,action:'ASAAS_WEBHOOK_RECORDED',productKey:reference.productKey,tenantId:reference.tenantId,companyId:reference.companyId,planId:reference.planId,paymentId,environment:this.environment(),payloadHash}});
        await tx.billingDelivery.create({data:{eventId,productKey:reference.productKey,status:'PENDING',availableAt:new Date()}});
      });
    } catch(error) {
      if(this.isUniqueViolation(error)) return {status:'accepted',eventId,paymentId,duplicate:true,processing:'recorded_for_reconciliation'};
      throw error;
    }
    return {status:'accepted',eventId,paymentId,duplicate:false,processing:'recorded_for_reconciliation'};
  }
  private normalizePaymentState(event:string,paymentStatus:string|undefined):string {
    if(event==='PAYMENT_REFUNDED') return 'REFUNDED';
    if(event==='PAYMENT_CHARGEBACK_REQUESTED') return 'CHARGEBACK';
    if(event==='PAYMENT_OVERDUE') return 'OVERDUE';
    if(event==='PAYMENT_DELETED') return 'CANCELED';
    if(event==='PAYMENT_RESTORED') return 'RESTORED';
    if(paymentStatus==='RECEIVED' || paymentStatus==='CONFIRMED') return 'PAID';
    return 'PENDING_RECONCILIATION';
  }
  private environment():'sandbox'|'production' { return process.env.NODE_ENV==='production'?'production':'sandbox'; }
  private stringValue(value:unknown):string|undefined { return typeof value==='string' && value.trim()?value.trim():undefined; }
  private isUniqueViolation(error:unknown):boolean { return typeof error==='object' && error!==null && 'code' in error && (error as {code?:string}).code==='P2002'; }
}
