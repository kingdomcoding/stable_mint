defmodule StableMintWeb.Plugs.IdempotencyKey do
  import Plug.Conn

  def init(opts), do: opts

  def call(%{method: method} = conn, _opts) when method in ["GET", "HEAD", "OPTIONS"], do: conn

  def call(conn, _opts) do
    case get_req_header(conn, "idempotency-key") do
      [key] when byte_size(key) > 0 ->
        params = Map.put(conn.params, "idempotency_key", key)
        %{conn | params: params}

      _ ->
        conn
        |> put_resp_content_type("application/vnd.api+json")
        |> send_resp(422, Jason.encode!(%{
          errors: [%{status: "422", title: "Missing Idempotency-Key",
            detail: "The Idempotency-Key header is required for mutating requests"}]
        }))
        |> halt()
    end
  end
end
