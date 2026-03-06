defmodule StableMintWeb.AuditController do
  use StableMintWeb, :controller

  def show(conn, _params) do
    {:ok, result} = StableMint.Platform.check_balanced()
    json(conn, %{
      balanced: result.balanced,
      total_debits: result.total_debits,
      total_credits: result.total_credits
    })
  end
end
