defmodule StableMint.Chains.Adapter do
  @type address :: String.t()
  @type tx_hash :: String.t()
  @type amount :: Decimal.t()
  @type token_contract :: String.t()
  @type tx_status :: :pending | :confirmed | :failed

  @callback mint(keyword()) :: {:ok, tx_hash()} | {:error, term()}
  @callback burn(keyword()) :: {:ok, tx_hash()} | {:error, term()}
  @callback transfer(keyword()) :: {:ok, tx_hash()} | {:error, term()}
  @callback get_transaction_status(tx_hash()) :: {:ok, tx_status()} | {:error, term()}
  @callback get_balance(address(), token_contract()) :: {:ok, amount()} | {:error, term()}
  @callback validate_address(address()) :: :ok | {:error, String.t()}
  @callback finality_time() :: pos_integer()
  @callback chain_name() :: String.t()
end
