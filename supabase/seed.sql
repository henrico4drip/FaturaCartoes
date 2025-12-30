insert into public.transacoes (data, descricao, valor, fatura_mes_ref, dono, categoria, hash_unico)
values
('2025-12-05','Supermercado', 320.50, '2025-12','eu','mercado','2025-12-05_320.50_Supermercado_0'),
('2025-12-08','Farmácia', 89.90, '2025-12','dinda','saude','2025-12-08_89.90_Farmácia_0'),
('2025-12-12','Streaming', 29.90, '2025-12','pendente','servicos','2025-12-12_29.90_Streaming_0');

insert into public.pagamentos (data, valor, quem_pagou, mes_referencia, observacao)
values
('2025-12-10', 200.00, 'eu', '2025-12', 'PIX'),
('2025-12-15', 150.00, 'dinda', '2025-12', 'Transferência');

insert into public.fechamentos (mes, usuario, saldo_final)
values
('2025-11','eu', 50.00),
('2025-11','dinda', -20.00);

insert into public.regras_classificacao (descricao_padrao, dono_sugerido, categoria)
values
('Supermercado', 'eu', 'mercado'),
('Farmácia', 'dinda', 'saude');
