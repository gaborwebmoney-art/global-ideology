package app.globalideology.billing

import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClient.BillingResponseCode
import com.android.billingclient.api.BillingClient.ProductType
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Global Ideology: Google Play Billing for one-time products (the four extra branches and the bundle).
 *
 * The app never trusts a purchase on the device. It hands the purchase token to the server (Supabase Edge Function
 * play-verify), which checks it with the Google Play Developer API, stores the entitlement and acknowledges it.
 * So this plugin does not acknowledge or consume anything itself.
 *
 * JS API (window.Capacitor.registerPlugin('GIBilling')):
 *   connect()                         -> { ok, code }
 *   getProducts({ ids: [..] })        -> { products: [{ id, title, price, micros, currency }] }
 *   purchase({ id, account })         -> { state: purchased|pending|cancelled|owned|error, purchase?, code?, message? }
 *   queryPurchases()                  -> { purchases: [purchase] }
 *   event "purchaseUpdated"           -> { state, purchase }   (purchases that finish later, e.g. pending payments)
 * purchase = { token, orderId, products: [..], state: purchased|pending|unknown, acknowledged, account, time }
 */
@CapacitorPlugin(name = "GIBilling")
class GIBillingPlugin : Plugin(), PurchasesUpdatedListener {

    private var client: BillingClient? = null
    private val details = HashMap<String, ProductDetails>()
    private var purchaseCall: PluginCall? = null
    private var purchaseId: String? = null

    override fun load() {
        client = BillingClient.newBuilder(context)
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build()
    }

    override fun handleOnDestroy() {
        try { client?.endConnection() } catch (_: Exception) { }
        super.handleOnDestroy()
    }

    private fun ready(): Boolean = client?.isReady == true

    /** Runs [then] once the billing service is connected, or rejects [call]. */
    private fun withClient(call: PluginCall, then: (BillingClient) -> Unit) {
        val c = client ?: return call.reject("Billing is not available", "unavailable")
        if (c.isReady) return then(c)
        c.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingResponseCode.OK) then(c)
                else call.reject("Billing setup failed: " + result.debugMessage, code(result.responseCode))
            }
            override fun onBillingServiceDisconnected() { /* auto reconnection is on; the next call retries */ }
        })
    }

    @PluginMethod
    fun connect(call: PluginCall) {
        withClient(call) { call.resolve(JSObject().put("ok", true).put("code", "ok")) }
    }

    @PluginMethod
    fun getProducts(call: PluginCall) {
        val ids = call.getArray("ids")?.toList<String>() ?: emptyList()
        if (ids.isEmpty()) return call.resolve(JSObject().put("products", JSArray()))
        withClient(call) { c ->
            val list = ids.map { QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(ProductType.INAPP).build() }
            c.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(list).build()) { result, res ->
                if (result.responseCode != BillingResponseCode.OK) {
                    call.reject("Products could not be loaded: " + result.debugMessage, code(result.responseCode)); return@queryProductDetailsAsync
                }
                val out = JSArray()
                for (pd in res.productDetailsList) {
                    details[pd.productId] = pd
                    val o = pd.oneTimePurchaseOfferDetails
                    out.put(JSObject().put("id", pd.productId).put("title", pd.name)
                        .put("price", o?.formattedPrice ?: "").put("micros", o?.priceAmountMicros ?: 0L).put("currency", o?.priceCurrencyCode ?: ""))
                }
                call.resolve(JSObject().put("products", out))
            }
        }
    }

    @PluginMethod
    fun purchase(call: PluginCall) {
        val id = call.getString("id") ?: return call.reject("Missing product id", "bad")
        val account = call.getString("account") ?: return call.reject("Missing account", "bad")
        if (purchaseCall != null) return call.reject("A purchase is already in progress", "busy")
        withClient(call) { c ->
            val launch = { pd: ProductDetails ->
                val params = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(listOf(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(pd).build()))
                    .setObfuscatedAccountId(account)
                    .build()
                purchaseCall = call; purchaseId = id
                activity.runOnUiThread {
                    val r = c.launchBillingFlow(activity, params)
                    if (r.responseCode != BillingResponseCode.OK) finishPurchase(r, null)
                }
            }
            val known = details[id]
            if (known != null) launch(known)
            else {
                val p = QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(ProductType.INAPP).build()
                c.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(listOf(p)).build()) { result, res ->
                    val pd = res.productDetailsList.firstOrNull()
                    if (result.responseCode != BillingResponseCode.OK || pd == null) call.reject("Product not found: $id", code(result.responseCode))
                    else { details[id] = pd; launch(pd) }
                }
            }
        }
    }

    @PluginMethod
    fun queryPurchases(call: PluginCall) {
        withClient(call) { c ->
            c.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(ProductType.INAPP).build()) { result, purchases ->
                if (result.responseCode != BillingResponseCode.OK) {
                    call.reject("Purchases could not be loaded: " + result.debugMessage, code(result.responseCode)); return@queryPurchasesAsync
                }
                val out = JSArray(); purchases.forEach { out.put(json(it)) }
                call.resolve(JSObject().put("purchases", out))
            }
        }
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        val mine = purchases?.firstOrNull { p -> purchaseId == null || p.products.contains(purchaseId) } ?: purchases?.firstOrNull()
        if (purchaseCall != null) { finishPurchase(result, mine); purchases?.filter { it !== mine }?.forEach { notifyListeners("purchaseUpdated", event(it)) } }
        else purchases?.forEach { notifyListeners("purchaseUpdated", event(it)) }
    }

    private fun finishPurchase(result: BillingResult, p: Purchase?) {
        val call = purchaseCall ?: return
        purchaseCall = null; purchaseId = null
        val out = JSObject()
        when (result.responseCode) {
            BillingResponseCode.OK -> if (p != null) out.put("state", state(p)).put("purchase", json(p)) else out.put("state", "error").put("code", "empty")
            BillingResponseCode.USER_CANCELED -> out.put("state", "cancelled")
            BillingResponseCode.ITEM_ALREADY_OWNED -> out.put("state", "owned")
            else -> out.put("state", "error").put("code", code(result.responseCode)).put("message", result.debugMessage)
        }
        call.resolve(out)
    }

    private fun event(p: Purchase) = JSObject().put("state", state(p)).put("purchase", json(p))

    private fun state(p: Purchase) = when (p.purchaseState) {
        Purchase.PurchaseState.PURCHASED -> "purchased"
        Purchase.PurchaseState.PENDING -> "pending"
        else -> "unknown"
    }

    private fun json(p: Purchase): JSObject {
        val ids = JSArray(); p.products.forEach { ids.put(it) }
        return JSObject().put("token", p.purchaseToken).put("orderId", p.orderId ?: "").put("products", ids)
            .put("state", state(p)).put("acknowledged", p.isAcknowledged)
            .put("account", p.accountIdentifiers?.obfuscatedAccountId ?: "").put("time", p.purchaseTime)
    }

    private fun code(c: Int): String = when (c) {
        BillingResponseCode.OK -> "ok"
        BillingResponseCode.USER_CANCELED -> "cancelled"
        BillingResponseCode.SERVICE_UNAVAILABLE, BillingResponseCode.SERVICE_DISCONNECTED, BillingResponseCode.NETWORK_ERROR -> "offline"
        BillingResponseCode.BILLING_UNAVAILABLE -> "unavailable"
        BillingResponseCode.ITEM_UNAVAILABLE -> "item_unavailable"
        BillingResponseCode.ITEM_ALREADY_OWNED -> "owned"
        BillingResponseCode.DEVELOPER_ERROR -> "developer"
        else -> "error_$c"
    }
}
