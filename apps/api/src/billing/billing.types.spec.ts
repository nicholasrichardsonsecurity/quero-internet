import { isBillingEventName, parseBillingReference } from './billing.types';
describe('billing contract',()=>{
  it('parses the versioned reference',()=>expect(parseBillingReference('aplivora:v1:loopclub:tenant-1:company-1:plan-pro:payment-1')).toEqual({productKey:'loopclub',tenantId:'tenant-1',companyId:'company-1',planId:'plan-pro',paymentId:'payment-1'}));
  it('rejects malformed references',()=>{
    expect(parseBillingReference('aplivora:v2:loopclub:tenant:company:plan:payment')).toBeNull();
    expect(parseBillingReference('aplivora:v1:loopclub:tenant:company:plan:payment:extra')).toBeNull();
    expect(parseBillingReference('aplivora:v1:loopclub:tenant:company:plan:payment/unsafe')).toBeNull();
  });
  it('allows only supported events',()=>{expect(isBillingEventName('PAYMENT_RECEIVED')).toBe(true);expect(isBillingEventName('UNKNOWN_EVENT')).toBe(false);});
});
