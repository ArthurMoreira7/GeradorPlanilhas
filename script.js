const { useState, useEffect } = React;

function App() {
  // --- CONFIGURAÇÃO DE ACESSO ---
  const [autorizado, setAutorizado] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const SENHA_DE_ACESSO = "uniautos2026";

  // Limites de 2026
  const hoje = new Date().toISOString().split("T")[0];
  const inicioAno = "2026-01-01";
  const fimAno = "2026-12-31";

  // Estados de dados
  const [registros, setRegistros] = useState(() => {
    const salvos = JSON.parse(localStorage.getItem("uniautos_db_v5")) || [];
    // Filtra para garantir que apenas 2026 apareça
    return salvos.filter((r) => r.data >= inicioAno && r.data <= fimAno);
  });

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

  // Salvar dados sempre que houver alteração
  useEffect(() => {
    if (autorizado) {
      localStorage.setItem("uniautos_db_v5", JSON.stringify(registros));
      const listaUnica = [...new Set(registros.map((r) => r.desc))].filter(
        Boolean
      );
      setSugestoes(listaUnica);
      localStorage.setItem("uniautos_sugestoes", JSON.stringify(listaUnica));
    }
  }, [registros, autorizado]);

  const verificarSenha = () => {
    if (senhaDigitada === SENHA_DE_ACESSO) {
      setAutorizado(true);
    } else {
      alert("Acesso Negado!");
      setSenhaDigitada("");
    }
  };

  // FUNÇÃO PARA GERAR PLANILHA (Excel)
  const exportarParaExcel = () => {
    try {
      if (registros.length === 0) {
        alert("Não há dados para exportar.");
        return;
      }
      const ws = XLSX.utils.json_to_sheet(
        registros.map((r) => ({
          Data: new Date(r.data).toLocaleDateString("pt-BR", {
            timeZone: "UTC",
          }),
          Descrição: r.desc,
          Valor: r.valor,
          Categoria: r.tipo.toUpperCase(),
          Pagamento: r.pagamento,
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
      XLSX.writeFile(wb, "Uniautos_Relatorio_2026.xlsx");
    } catch (error) {
      alert("Erro ao gerar planilha. Verifique a conexão.");
    }
  };

  // 1. TELA DE BLOQUEIO (Segurança de Entrada)
  if (!autorizado) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2c3e50",
          fontFamily: "sans-serif",
          color: "white",
        }}
      >
        <i
          className="fas fa-lock"
          style={{ fontSize: "3rem", color: "#f39c12", marginBottom: "20px" }}
        ></i>
        <h2 style={{ marginBottom: "20px" }}>SISTEMA RESTRITO</h2>
        <input
          type="password"
          placeholder="Digite a Senha"
          value={senhaDigitada}
          onChange={(e) => setSenhaDigitada(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && verificarSenha()}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            width: "250px",
            textAlign: "center",
            fontSize: "1.1rem",
          }}
        />
        <button
          onClick={verificarSenha}
          style={{
            marginTop: "15px",
            padding: "12px 30px",
            backgroundColor: "#f39c12",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Acessar Uniautos
        </button>
      </div>
    );
  }

  // LÓGICA DO SISTEMA APÓS SENHA
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.data < inicioAno || formData.data > fimAno) {
      alert("Atenção: Apenas lançamentos de 2026.");
      return;
    }
    const novo = {
      ...formData,
      internalKey: Date.now(),
      valor: parseFloat(formData.valor),
    };
    setRegistros([novo, ...registros]);
    setFormData({ ...formData, desc: "", valor: "", data: hoje });
  };

  const remover = (key) => {
    if (confirm("Deseja excluir?"))
      setRegistros(registros.filter((r) => r.internalKey !== key));
  };

  const formatMoeda = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const totalRec = registros
    .filter((r) => r.tipo === "receita")
    .reduce((a, b) => a + b.valor, 0);
  const totalDesp = registros
    .filter((r) => r.tipo === "despesa")
    .reduce((a, b) => a + b.valor, 0);
  const saldo = totalRec - totalDesp;

  return (
    <div>
      <header>
        <h1>UNIAUTOS</h1>
        <p>
          <i className="fas fa-calendar-check"></i> GESTÃO FINANCEIRA ATUAL
        </p>
      </header>

      <main className="container">
        <section className="dashboard">
          <div className="card card-receita">
            <h3>Receitas</h3>
            <p>{formatMoeda(totalRec)}</p>
          </div>
          <div className="card card-saldo">
            <h3>Saldo em Caixa</h3>
            <p
              style={{ color: saldo >= 0 ? "var(--gray-dark)" : "var(--red)" }}
            >
              {formatMoeda(saldo)}
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
            {/* BOTÃO DE EXCEL REATIVADO */}
            <button onClick={exportarParaExcel} className="btn-excel">
              <i className="fas fa-file-excel"></i> Gerar Planilha
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Data</label>
              <input
                type="date"
                value={formData.data}
                min={inicioAno}
                max={fimAno}
                onChange={(e) =>
                  setFormData({ ...formData, data: e.target.value })
                }
                required
              />
            </div>
            <div className="input-group">
              <label>Serviço / Produto</label>
              <input
                list="historico-servicos"
                value={formData.desc}
                onChange={(e) =>
                  setFormData({ ...formData, desc: e.target.value })
                }
                placeholder="Descrição"
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
              <i className="fas fa-save"></i> Salvar
            </button>
          </form>
        </section>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Pgto</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {registros
                .sort((a, b) => new Date(b.data) - new Date(a.data))
                .map((r) => (
                  <tr key={r.internalKey}>
                    <td>
                      {new Date(r.data).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
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
                    <td>
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
