[Previous test content remains unchanged]

Clarinet.test({
    name: "Handles trade history overflow correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        
        // Create 51 listings and complete them to overflow history
        for (let i = 0; i < 51; i++) {
            chain.mineBlock([
                Tx.contractCall('trade_vault', 'create-listing', [
                    types.uint(i + 1),
                    types.ascii("Test Collectible")
                ], wallet1.address)
            ]);
            
            chain.mineBlock([
                Tx.contractCall('trade_vault', 'make-offer', [
                    types.uint(i),
                    types.uint(100 + i)
                ], wallet2.address)
            ]);
            
            chain.mineBlock([
                Tx.contractCall('trade_vault', 'accept-offer', [
                    types.uint(i)
                ], wallet1.address)
            ]);
        }
        
        // Verify history maintains 50 items
        let history = chain.callReadOnlyFn(
            'trade_vault',
            'get-user-trade-history',
            [types.principal(wallet1.address)],
            wallet1.address
        );
        
        assertEquals(history.result.length, 50);
    }
});

Clarinet.test({
    name: "Validates item IDs correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('trade_vault', 'create-listing', [
                types.uint(0),
                types.ascii("Invalid Item")
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectErr().expectUint(105);
    }
});
