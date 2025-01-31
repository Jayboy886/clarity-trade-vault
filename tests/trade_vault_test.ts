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
    name: "Cannot make offer on own listing",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        // Create listing
        chain.mineBlock([
            Tx.contractCall('trade_vault', 'create-listing', [
                types.uint(1),
                types.ascii("Test Collectible")
            ], wallet1.address)
        ]);
        
        // Try to make offer on own listing
        let block = chain.mineBlock([
            Tx.contractCall('trade_vault', 'make-offer', [
                types.uint(0),
                types.uint(2)
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectErr().expectUint(100);
    }
});

Clarinet.test({
    name: "Cannot accept/reject offers on completed listings", 
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        const wallet3 = accounts.get('wallet_3')!;
        
        // Create listing and offers
        chain.mineBlock([
            Tx.contractCall('trade_vault', 'create-listing', [
                types.uint(1),
                types.ascii("Test Collectible")
            ], wallet1.address)
        ]);
        
        chain.mineBlock([
            Tx.contractCall('trade_vault', 'make-offer', [
                types.uint(0),
                types.uint(2)
            ], wallet2.address)
        ]);
        
        chain.mineBlock([
            Tx.contractCall('trade_vault', 'make-offer', [
                types.uint(0),
                types.uint(3)
            ], wallet3.address)
        ]);
        
        // Accept first offer
        chain.mineBlock([
            Tx.contractCall('trade_vault', 'accept-offer', [
                types.uint(0)
            ], wallet1.address)
        ]);
        
        // Try to accept second offer
        let block = chain.mineBlock([
            Tx.contractCall('trade_vault', 'accept-offer', [
                types.uint(1)
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectErr().expectUint(104);
    }
});
