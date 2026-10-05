/* Public catalog configuration only. Never put Paymenter API keys here.
 * Use actual, public product checkout URLs from your Paymenter installation.
 * Set reviewedFor to workloads that the configured product can actually run.
 * priceLabel must match that product's current price; it is not used for billing.
 */
window.NUC_HOSTING_CONFIG = {
  paymenterUrl: null,
  products: {
    cpu: { checkoutUrl: null, priceLabel: null, reviewedFor: [] },
    gpu: { checkoutUrl: null, priceLabel: null, reviewedFor: [] }
  }
};
