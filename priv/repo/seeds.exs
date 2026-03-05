{:ok, coin} = StableMint.Stablecoins.create_stablecoin("Acme Dollar", "ACME")
IO.puts("Created stablecoin: #{coin.name} (#{coin.symbol})")

{:ok, eth_deploy} = StableMint.Stablecoins.deploy_to_chain(coin.id, :ethereum)
{:ok, sol_deploy} = StableMint.Stablecoins.deploy_to_chain(coin.id, :solana)
{:ok, stl_deploy} = StableMint.Stablecoins.deploy_to_chain(coin.id, :stellar)
IO.puts("Deployed to: ethereum (#{eth_deploy.contract_address})")
IO.puts("Deployed to: solana (#{sol_deploy.contract_address})")
IO.puts("Deployed to: stellar (#{stl_deploy.contract_address})")

{:ok, issuer} = StableMint.Banking.create_account("Acme Treasury", :issuer, :platform)
{:ok, alice} = StableMint.Banking.create_account("Alice Corp", :customer, :platform)
{:ok, bob} = StableMint.Banking.create_account("Bob Inc", :customer, :self)
IO.puts("Created accounts: #{issuer.name}, #{alice.name}, #{bob.name}")

{:ok, alice_eth} = StableMint.Banking.create_address(alice.id, :ethereum, "0x" <> String.duplicate("aa", 20))
{:ok, alice_sol} = StableMint.Banking.create_address(alice.id, :solana, String.duplicate("A", 44))
{:ok, bob_eth} = StableMint.Banking.create_address(bob.id, :ethereum, "0x" <> String.duplicate("bb", 20))
{:ok, bob_stl} = StableMint.Banking.create_address(bob.id, :stellar, "G" <> String.duplicate("B", 55))
IO.puts("Created addresses for Alice (eth: #{alice_eth.address}, sol: #{alice_sol.address})")
IO.puts("Created addresses for Bob (eth: #{bob_eth.address}, stl: #{bob_stl.address})")

{:ok, _fiat} = StableMint.Banking.create_fiat_account(%{
  institution_name: "First National Bank",
  account_type: :checking,
  routing_number: "021000021",
  account_number_last4: "4567",
  account_id: issuer.id
})
IO.puts("Created fiat account for #{issuer.name}")

IO.puts("\nSeed data created successfully!")
IO.puts("API:       http://localhost:4400/api")
IO.puts("OpenAPI:   http://localhost:4400/api/open_api")
