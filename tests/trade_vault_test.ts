Clarinet.test({
    name: "Validates description correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('trade_vault', 'create-listing', [
                types.uint(1),
                types.ascii("")
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectErr().expectUint(107);
    }
});

[... Previous test content remains unchanged ...]
