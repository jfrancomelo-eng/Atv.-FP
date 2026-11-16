"""Regras de negócio do Conde Avisa (RN01 a RN10 do README)."""
from datetime import datetime, timedelta

FORMATO = "%d/%m/%Y %H:%M"

# RN01 - fontes aceitas (nome curto -> nome lido no boletim)
FONTES = {
    "Grande Recife": "Grande Recife Consórcio de Transporte",
    "CTTU": "CTTU, trânsito do Recife",
    "CBTU": "CBTU, metrô do Recife",
    "APAC": "APAC, alertas de chuva",
}

# RN02 - tipos de aviso
TIPOS = ["obra", "desvio", "interdição", "parada desativada", "mudança de linha", "chuva forte"]

# RN03 - paradas do trecho Derby - Ponte Duarte Coelho (lista inicial, a confirmar em campo)
PARADAS = [
    "Todo o trecho",
    "Derby",
    "Rua Dom Bosco",
    "Rua do Hospício",
    "Rua Gervásio Pires",
    "Shopping Boa Vista",
    "Rua Sete de Setembro",
    "Ponte Duarte Coelho",
]

LIMITE_OQUE = 100          # RN04 - caracteres do campo "o quê"
PICOS = (7, 17)            # RN08 - início dos picos (7h-9h e 17h-19h)
ANTECEDENCIA_MIN = 60      # RN08 - minutos antes do pico
HORA_VESPERA = 20          # RN08 - obra programada: até 20h da véspera

CAMPOS = ["id", "tipo", "fonte", "oque", "linhas", "onde", "inicio", "fim",
          "link", "hora_fonte", "autor", "checador", "hora_canal"]


class ErroAviso(ValueError):
    """Dado inválido. A mensagem diz o campo e o que é esperado."""


def ler_data(texto, campo):
    try:
        return datetime.strptime(texto.strip(), FORMATO)
    except (ValueError, AttributeError):
        raise ErroAviso(f"{campo}: use o formato DD/MM/AAAA HH:MM (ex.: 25/11/2026 07:30).")


def escolher(valor, opcoes, campo):
    for opcao in opcoes:
        if valor.strip().lower() == opcao.lower():
            return opcao
    raise ErroAviso(f"{campo}: valor não aceito. Opções: {', '.join(opcoes)}.")


def novo_aviso(dados):
    """Valida os dados digitados e devolve o aviso pronto para salvar (RN01-RN05)."""
    aviso = {c: str(dados.get(c, "")).strip() for c in CAMPOS}
    aviso["tipo"] = escolher(aviso["tipo"], TIPOS, "Tipo")
    aviso["fonte"] = escolher(aviso["fonte"], list(FONTES), "Fonte")
    aviso["onde"] = escolher(aviso["onde"], PARADAS, "Onde (parada do trecho)")

    for campo, nome in [("oque", "O quê"), ("link", "Link da fonte"), ("autor", "Autor")]:
        if not aviso[campo]:
            raise ErroAviso(f"{nome}: campo obrigatório.")
    if len(aviso["oque"]) > LIMITE_OQUE:
        raise ErroAviso(f"O quê: use no máximo {LIMITE_OQUE} caracteres.")
    if not aviso["linhas"]:
        if aviso["tipo"] != "chuva forte":
            raise ErroAviso("Linhas: informe as linhas afetadas (ex.: 040, 043).")
        aviso["linhas"] = "todas"

    inicio = ler_data(aviso["inicio"], "Início do evento")
    fim = ler_data(aviso["fim"], "Até quando")
    ler_data(aviso["hora_fonte"], "Horário na fonte")
    if fim < inicio:
        raise ErroAviso("Até quando: deve ser igual ou depois do início do evento.")

    aviso["checador"] = ""
    aviso["hora_canal"] = ""
    return aviso


def checar(aviso, checador):
    """RN06 - dupla checagem feita por outro integrante."""
    checador = checador.strip()
    if not checador:
        raise ErroAviso("Checador: informe quem conferiu o aviso.")
    if checador.lower() == aviso["autor"].lower():
        raise ErroAviso("Checador: a checagem deve ser feita por outra pessoa, não pelo autor.")
    aviso["checador"] = checador


def vigente(aviso, momento):
    return ler_data(aviso["fim"], "Até quando") >= momento


def pico_atingido(inicio):
    """Primeiro pico (7h ou 17h) que o evento atinge."""
    base = inicio.replace(minute=0, second=0, microsecond=0)
    if inicio.hour < 9:
        return base.replace(hour=PICOS[0])
    if inicio.hour < 19:
        return base.replace(hour=PICOS[1])
    return (base + timedelta(days=1)).replace(hour=PICOS[0])


def prazo_util(aviso):
    """RN08 - horário limite para o aviso ter antecedência útil."""
    inicio = ler_data(aviso["inicio"], "Início do evento")
    if aviso["tipo"] == "obra":
        return (inicio - timedelta(days=1)).replace(hour=HORA_VESPERA, minute=0)
    return pico_atingido(inicio) - timedelta(minutes=ANTECEDENCIA_MIN)


def antecedencia_util(aviso, campo="hora_fonte"):
    """True/False para a fonte ou o canal; None se ainda não houver horário."""
    if not aviso.get(campo):
        return None
    return ler_data(aviso[campo], campo) <= prazo_util(aviso)


def atraso_minutos(aviso):
    """RN09 - minutos entre a publicação na fonte e no canal."""
    if not aviso.get("hora_canal"):
        return None
    diferenca = ler_data(aviso["hora_canal"], "Horário no canal") - ler_data(aviso["hora_fonte"], "Horário na fonte")
    return int(diferenca.total_seconds() // 60)
