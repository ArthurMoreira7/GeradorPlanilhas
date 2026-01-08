const { useState, useEffect } = React;

function App() {
  const hoje = new Date().toISOString().split("T")[0];
  const [registros, setRegistros] = useState(
    JSON.parse(localStorage.getItem("uniautos_db_v5")) || []
  );

  // Lista de sugestões baseada no que já foi digitado antes
  const [sugestoes, setSugestoes] = useState(
    JSON.parse(localStorage.getItem("uniautos_sugestoes")) || []
  );

  const [formData, setFormData] = useState({
    data: hoje,
    desc: "",
    valor: "",
    tipo: "receita",
    pagamento: "PIX",
  });

  useEffect(() => {
    localStorage.setItem("uniautos_db_v5", JSON.stringify(registros));

    // Atualiza a lista de sugestões únicas com base nos serviços registrados
    const listaUnica = [...new Set(registros.map((r) => r.desc))];
    setSugestoes(listaUnica);
    localStorage.setItem("uniautos_sugestoes", JSON.stringify(listaUnica));
  }, [registros]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.data < hoje) {
      alert("Erro: Não selecione datas anteriores a hoje.");
      return;
    }

    const novo = {
      ...formData,
      internalKey: Date.now(),
      valor: parseFloat(formData.valor),
    };
    setRegistros([novo, ...registros]);

    // Reseta o formulário
    setFormData({ ...formData, desc: "", valor: "", data: hoje });
  };

  const remover = (key) => {
    if (confirm("Deseja excluir este registro?"))
      setRegistros(registros.filter((r) => r.internalKey !== key));
  };

  const exportar = () => {
    const ws = XLSX.utils.json_to_sheet(
      registros.map((r) => ({
        Data: new Date(r.data).toLocaleDateString("pt-BR", { timeZone: "UTC" }),
        Servico_Produto: r.desc,
        Valor: r.valor,
        Categoria: r.tipo.toUpperCase(),
        Pagamento: r.pagamento,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, `Uniautos_Planilha.xlsx`);
  };

  const totalRec = registros
    .filter((r) => r.tipo === "receita")
    .reduce((a, b) => a + b.valor, 0);
  const totalDesp = registros
    .filter((r) => r.tipo === "despesa")
    .reduce((a, b) => a + b.valor, 0);
  const formatMoeda = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <header>
        <h1>UNIAUTOS</h1>
        <p>
          <i className="fas fa-tools"></i> CONTROLE DE OFICINA
        </p>
      </header>

      <main className="container">
        <section className="dashboard">
          <div className="card card-receita">
            <h3>Receitas</h3>
            <p>{formatMoeda(totalRec)}</p>
          </div>
          <div className="card card-saldo">
            <h3>Saldo Total</h3>
            <p
              style={{
                color:
                  totalRec - totalDesp >= 0 ? "var(--gray-dark)" : "var(--red)",
              }}
            >
              {formatMoeda(totalRec - totalDesp)}
            </p>
          </div>
          <div className="card card-despesa">
            <h3>Despesas</h3>
            <p>{formatMoeda(totalDesp)}</p>
          </div>
        </section>

        <section className="box-panel">
          <div className="panel-header">
            <h3>Lançamento de Caixa</h3>
            <button onClick={exportar} className="btn-excel">
              <i className="fas fa-file-excel"></i> Gerar Planilha
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Data</label>
              <input
                type="date"
                value={formData.data}
                min={hoje}
                onChange={(e) =>
                  setFormData({ ...formData, data: e.target.value })
                }
                required
              />
            </div>

            <div className="input-group">
              <label>Serviço / Produto</label>
              {/* O campo agora tem um atributo "list" que puxa as sugestões salvas */}
              <input
                list="historico-servicos"
                value={formData.desc}
                onChange={(e) =>
                  setFormData({ ...formData, desc: e.target.value })
                }
                placeholder="Ex: Troca de óleo"
                required
              />
              <datalist id="historico-servicos">
                {sugestoes.map((s, index) => (
                  <option key={index} value={s} />
                ))}
              </datalist>
            </div>

            <div className="input-group">
              <label>Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) =>
                  setFormData({ ...formData, valor: e.target.value })
                }
                placeholder="0,00"
                required
              />
            </div>
            <div className="input-group">
              <label>Categoria</label>
              <select
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div className="input-group">
              <label>Pagamento</label>
              <select
                value={formData.pagamento}
                onChange={(e) =>
                  setFormData({ ...formData, pagamento: e.target.value })
                }
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">DINHEIRO</option>
                <option value="CARTÃO">CARTÃO</option>
              </select>
            </div>
            <button type="submit" className="btn-confirm">
              <i className="fas fa-save"></i> Confirmar Lançamento
            </button>
          </form>
        </section>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Serviço / Produto</th>
                <th>Valor</th>
                <th>Pgto</th>
                <th style={{ textAlign: "center" }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {registros
                .sort((a, b) => new Date(b.data) - new Date(a.data))
                .map((r) => (
                  <tr key={r.internalKey}>
                    <td>
                      {new Date(r.data).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>
                      <strong>{r.desc}</strong>
                    </td>
                    <td
                      style={{
                        color:
                          r.tipo === "receita" ? "var(--green)" : "var(--red)",
                        fontWeight: "bold",
                      }}
                    >
                      {formatMoeda(r.valor)}
                    </td>
                    <td>{r.pagamento}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => remover(r.internalKey)}
                        className="btn-delete"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
