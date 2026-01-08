const { useState, useEffect } = React;

function App() {
    // Configura data atual para travar o calendário
    const hoje = new Date().toISOString().split('T')[0];

    const [registros, setRegistros] = useState(JSON.parse(localStorage.getItem('uniautos_db_v5')) || []);
    const [formData, setFormData] = useState({
        data: hoje,
        desc: '',
        valor: '',
        tipo: 'receita',
        pagamento: 'PIX'
    });

    // Salva automaticamente no navegador sempre que houver mudanças
    useEffect(() => {
        localStorage.setItem('uniautos_db_v5', JSON.stringify(registros));
    }, [registros]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Bloqueio de segurança para datas passadas
        if (formData.data < hoje) {
            alert("Erro: Não é permitido lançar registros em datas retroativas.");
            return;
        }

        // Gera um ID único de 4 dígitos para conferência
        const novoId = Math.floor(1000 + Math.random() * 9000);
        
        const novo = { ...formData, id: novoId, valor: parseFloat(formData.valor) };
        setRegistros([novo, ...registros]);
        
        // Limpa o formulário após salvar
        setFormData({ ...formData, desc: '', valor: '', data: hoje });
    };

    const remover = (id) => { 
        if(confirm("Deseja excluir este registro permanentemente?")) 
            setRegistros(registros.filter(r => r.id !== id)); 
    };

    const exportar = () => {
        if(registros.length === 0) return alert("Adicione dados antes de exportar.");

        const dadosParaPlanilha = registros.map(r => ({
            ID: r.id,
            Data: new Date(r.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
            Servico_Produto: r.desc,
            Valor: r.valor,
            Categoria: r.tipo === 'receita' ? 'ENTRADA' : 'SAÍDA',
            Pagamento: r.pagamento
        }));

        const ws = XLSX.utils.json_to_sheet(dadosParaPlanilha);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financeiro_Uniautos");
        XLSX.writeFile(wb, `Planilha_Uniautos_ID_${new Date().getFullYear()}.xlsx`);
    };

    const totalRec = registros.filter(r => r.tipo === 'receita').reduce((a, b) => a + b.valor, 0);
    const totalDesp = registros.filter(r => r.tipo === 'despesa').reduce((a, b) => a + b.valor, 0);
    const formatMoeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div>
            <header>
                <h1>UNIAUTOS</h1>
                <p><i className="fas fa-tools"></i> CONTROLE DE OFICINA PROFISSIONAL</p>
            </header>

            <main className="container">
                <section className="dashboard">
                    <div className="card card-receita">
                        <h3>Receitas (Entradas)</h3>
                        <p>{formatMoeda(totalRec)}</p>
                    </div>
                    <div className="card card-saldo">
                        <h3>Saldo Líquido</h3>
                        <p style={{color: (totalRec - totalDesp) >= 0 ? 'var(--gray-dark)' : 'var(--red)'}}>
                            {formatMoeda(totalRec - totalDesp)}
                        </p>
                    </div>
                    <div className="card card-despesa">
                        <h3>Despesas (Saídas)</h3>
                        <p>{formatMoeda(totalDesp)}</p>
                    </div>
                </section>

                <section className="box-panel">
                    <div className="panel-header">
                        <h3>Painel de Lançamentos</h3>
                        <button onClick={exportar} className="btn-excel">
                            <i className="fas fa-file-excel"></i> Gerar Planilha com ID
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label><i className="far fa-calendar-alt"></i> Data</label>
                            <input type="date" value={formData.data} min={hoje} onChange={e => setFormData({...formData, data: e.target.value})} required />
                        </div>
                        <div className="input-group">
                            <label>Serviço / Produto</label>
                            <input value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="Ex: Kit Embreagem LUK" required />
                        </div>
                        <div className="input-group">
                            <label>Valor Bruto</label>
                            <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} placeholder="0,00" required />
                        </div>
                        <div className="input-group">
                            <label>Categoria</label>
                            <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                                <option value="receita">Receita (Entrada)</option>
                                <option value="despesa">Despesa (Saída)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Pagamento</label>
                            <select value={formData.pagamento} onChange={e => setFormData({...formData, pagamento: e.target.value})}>
                                <option value="PIX">PIX</option>
                                <option value="DINHEIRO">DINHEIRO</option>
                                <option value="CARTÃO">CARTÃO / DÉBITO</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-confirm">
                            <i className="fas fa-check-double"></i> Confirmar Lançamento
                        </button>
                    </form>
                </section>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Data</th>
                                <th>Serviço / Produto</th>
                                <th>Valor</th>
                                <th>Pgto</th>
                                <th style={{textAlign:'center'}}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registros.sort((a,b) => new Date(b.data) - new Date(a.data)).map(r => (
                                <tr key={r.id}>
                                    <td style={{fontSize:'0.75rem', color:'#94a3b8', fontWeight:'bold'}}>#{r.id}</td>
                                    <td>
                                        <div className="date-cell">
                                            {new Date(r.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                        </div>
                                    </td>
                                    <td><strong>{r.desc}</strong></td>
                                    <td style={{color: r.tipo === 'receita' ? 'var(--green)' : 'var(--red)', fontWeight:'bold'}}>
                                        {formatMoeda(r.valor)}
                                    </td>
                                    <td><span style={{fontSize:'0.7rem', fontWeight:'800'}}>{r.pagamento}</span></td>
                                    <td style={{textAlign:'center'}}>
                                        <button onClick={() => remover(r.id)} className="btn-delete" title="Excluir">
                                            <i className="fas fa-trash-can"></i>
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);