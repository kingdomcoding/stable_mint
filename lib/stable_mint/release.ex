defmodule StableMint.Release do
  @app :stable_mint

  def migrate do
    load_app()
    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  def seed do
    load_app()
    migrate()
    Code.eval_file(Application.app_dir(@app, "priv/repo/seeds.exs"))
  end

  defp repos, do: Application.fetch_env!(@app, :ecto_repos)
  defp load_app, do: Application.ensure_all_started(@app)
end
