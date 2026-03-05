defmodule StableMint.Chains.StellarAdapter do
  @behaviour StableMint.Chains.Adapter

  @impl true
  def mint(opts) do
    with :ok <- validate_address(Keyword.fetch!(opts, :to)),
         :ok <- validate_amount(Keyword.fetch!(opts, :amount)) do
      {:ok, generate_tx_hash()}
    end
  end

  @impl true
  def burn(opts) do
    with :ok <- validate_address(Keyword.fetch!(opts, :from)),
         :ok <- validate_amount(Keyword.fetch!(opts, :amount)) do
      {:ok, generate_tx_hash()}
    end
  end

  @impl true
  def transfer(opts) do
    with :ok <- validate_address(Keyword.fetch!(opts, :from)),
         :ok <- validate_address(Keyword.fetch!(opts, :to)),
         :ok <- validate_amount(Keyword.fetch!(opts, :amount)) do
      {:ok, generate_tx_hash()}
    end
  end

  @impl true
  def get_transaction_status(_tx_hash) do
    case :rand.uniform(10) do
      n when n <= 9 -> {:ok, :confirmed}
      _ -> {:ok, :failed}
    end
  end

  @impl true
  def get_balance(address, _token) do
    with :ok <- validate_address(address), do: {:ok, Decimal.new("1000.000000")}
  end

  @impl true
  def validate_address(<<"G", rest::binary>>) when byte_size(rest) == 55, do: :ok
  def validate_address(_), do: {:error, "Invalid Stellar address: must start with G + 55 chars"}

  @impl true
  def finality_time, do: 5

  @impl true
  def chain_name, do: "stellar"

  defp validate_amount(amount) do
    if Decimal.gt?(amount, Decimal.new(0)), do: :ok, else: {:error, "Amount must be positive"}
  end

  defp generate_tx_hash do
    Base.encode16(:crypto.strong_rand_bytes(32), case: :lower)
  end
end
