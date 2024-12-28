import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can create a new listing",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('trade_vault', 'create-listing', [
                types.uint(1),
                types.ascii("Test Collectible")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectUint(0);
        
        // Verify listing details
        let listing = chain.callReadOnlyFn(
            'trade_vault',
            'get-listing',
            [types.uint(0)],
            wallet1.address
        );
        
        let listingData = listing.result.expectSome().expectTuple();
        assertEquals(listingData['item-id'], types.uint(1));
        assertEquals(listingData['status'], types.ascii("active"));
    }
});

Clarinet.test({
    name: "Can make and accept offers",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        
        // Create listing
        let block = chain.mineBlock([
            Tx.contractCall('trade_vault', 'create-listing', [
                types.uint(1),
                types.ascii("Test Collectible")
            ], wallet1.address)
        ]);
        
        // Make offer
        let offerBlock = chain.mineBlock([
            Tx.contractCall('trade_vault', 'make-offer', [
                types.uint(0),
                types.uint(2)
            ], wallet2.address)
        ]);
        
        offerBlock.receipts[0].result.expectOk().expectUint(0);
        
        // Accept offer
        let acceptBlock = chain.mineBlock([
            Tx.contractCall('trade_vault', 'accept-offer', [
                types.uint(0)
            ], wallet1.address)
        ]);
        
        acceptBlock.receipts[0].result.expectOk().expectBool(true);
        
        // Verify trade appears in history
        let history = chain.callReadOnlyFn(
            'trade_vault',
            'get-user-trade-history',
            [types.principal(wallet1.address)],
            wallet1.address
        );
        
        let historyData = history.result.expectList();
        assertEquals(historyData.length, 1);
        assertEquals(historyData[0], types.uint(0));
    }
});

Clarinet.test({
    name: "Cannot accept offer if not listing owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        const wallet3 = accounts.get('wallet_3')!;
        
        // Create listing
        chain.mineBlock([
            Tx.contractCall('trade_vault', 'create-listing', [
                types.uint(1),
                types.ascii("Test Collectible")
            ], wallet1.address)
        ]);
        
        // Make offer
        chain.mineBlock([
            Tx.contractCall('trade_vault', 'make-offer', [
                types.uint(0),
                types.uint(2)
            ], wallet2.address)
        ]);
        
        // Try to accept offer as non-owner
        let failedAcceptBlock = chain.mineBlock([
            Tx.contractCall('trade_vault', 'accept-offer', [
                types.uint(0)
            ], wallet3.address)
        ]);
        
        failedAcceptBlock.receipts[0].result.expectErr().expectUint(100);
    }
});