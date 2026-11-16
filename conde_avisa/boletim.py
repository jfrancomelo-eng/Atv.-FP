"""Boletim do canal (RN07) e relatório de antecedência (RN10)."""
from .regras import FONTES, FORMATO, antecedencia_util, atraso_minutos, ler_data, vigente

RODAPE = "Projeto acadêmico da CESAR School, não oficial. Confira sempre a fonte."
SEM_MUDANCAS = "Sem mudanças hoje no trecho Derby - Ponte Duarte Coelho."
HORARIOS = ("06:30", "16:30")


def hora_extenso(momento):
    return momento.strftime("%Hh%M")


def montar_boletim(avisos, momento):
    """Devolve (texto, avisos incluídos). Só entram avisos checados, vigentes
    e já publicados pela fonte até o horário do boletim."""
    incluidos = [a for a in avisos if a["checador"] and vigente(a, momento)
                 and ler_data(a["hora_fonte"], "Horário na fonte") <= momento]
    linhas = [f"Conde Avisa. Boletim de {momento:%d/%m/%Y} às {hora_extenso(momento)}.", ""]
    if not incluidos:
        linhas += [SEM_MUDANCAS, ""]
    for n, a in enumerate(incluidos, 1):
        fim = ler_data(a["fim"], "Até quando")
        linhas += [
            f"Aviso {n} de {len(incluidos)}: {a['tipo'].capitalize()}",
            f"O quê: {a['oque']}",
            f"Linhas: {a['linhas']}",
            f"Onde: {a['onde']}",
            f"Até quando: {fim:%d/%m/%Y} às {hora_extenso(fim)}",
            f"Fonte: {FONTES[a['fonte']]}. {a['link']}",
            "",
        ]
    linhas.append(RODAPE)
    return "\n".join(linhas), incluidos


def publicar(incluidos, momento):
    """Registra o horário no canal dos avisos publicados pela primeira vez."""
    for a in incluidos:
        if not a["hora_canal"]:
            a["hora_canal"] = momento.strftime(FORMATO)


def percentual(parte, total):
    return round(100 * parte / total) if total else 0


def relatorio(avisos):
    """RN10 - antecedência útil na fonte e no canal, por tipo de aviso."""
    total = len(avisos)
    uteis = sum(1 for a in avisos if antecedencia_util(a))
    pct = percentual(uteis, total)

    if total < 10:
        leitura = "Inconclusivo: menos de 10 eventos registrados."
    elif pct >= 60:
        leitura = "Fonte publica a tempo (60% ou mais)."
    elif pct < 40:
        leitura = "Sinal do Cenário 2: o dado público nasce tarde (menos de 40%)."
    else:
        leitura = "Entre 40% e 60%: decisão escrita do squad."

    linhas = [
        f"Eventos registrados: {total}",
        f"Com antecedência útil na fonte: {uteis} ({pct}%)",
        f"Leitura: {leitura}",
    ]

    publicados = [a for a in avisos if a["hora_canal"]]
    if publicados:
        uteis_canal = sum(1 for a in publicados if antecedencia_util(a, "hora_canal"))
        media = round(sum(atraso_minutos(a) for a in publicados) / len(publicados))
        linhas += [
            f"Publicados no canal: {len(publicados)}",
            f"Com antecedência útil no canal: {uteis_canal} ({percentual(uteis_canal, len(publicados))}%)",
            f"Atraso médio fonte -> canal: {media} min",
        ]

    linhas.append("Por tipo de aviso (útil na fonte / total):")
    tipos = sorted({a["tipo"] for a in avisos})
    for t in tipos:
        do_tipo = [a for a in avisos if a["tipo"] == t]
        linhas.append(f"  {t}: {sum(1 for a in do_tipo if antecedencia_util(a))} / {len(do_tipo)}")
    return "\n".join(linhas)
