"""Conde Avisa v0.1 - ferramenta do plantonista.

Uso:  python main.py                   (usa avisos.csv)
      python main.py dados/exemplo.csv (abre outra planilha)
"""
import sys
from datetime import datetime

from conde_avisa import dados
from conde_avisa.boletim import HORARIOS, montar_boletim, publicar, relatorio
from conde_avisa.regras import (FONTES, FORMATO, PARADAS, TIPOS, ErroAviso,
                                antecedencia_util, checar, escolher, ler_data, novo_aviso)

ARQUIVO = sys.argv[1] if len(sys.argv) > 1 else "avisos.csv"
sys.stdout.reconfigure(encoding="utf-8")


def perguntar(texto):
    return input(f"{texto}: ").strip()


def perguntar_opcao(texto, opcoes):
    """Repete a pergunta até o valor ser uma das opções (não perde o que já foi digitado)."""
    print(f"  Opções: {', '.join(opcoes)}")
    while True:
        try:
            return escolher(perguntar(texto), opcoes, texto)
        except ErroAviso as erro:
            print(f"  {erro}")


def registrar(avisos):
    print("\nNovo aviso. Datas no formato DD/MM/AAAA HH:MM.")
    entrada = {
        "tipo": perguntar_opcao("Tipo", TIPOS),
        "fonte": perguntar_opcao("Fonte", list(FONTES)),
        "oque": perguntar("O quê (até 100 caracteres)"),
        "linhas": perguntar("Linhas afetadas (ex.: 040, 043; vazio só para chuva)"),
        "onde": perguntar_opcao("Onde", PARADAS),
        "inicio": perguntar("Início do evento"),
        "fim": perguntar("Até quando"),
        "link": perguntar("Link da fonte"),
        "hora_fonte": perguntar("Horário em que a fonte publicou"),
        "autor": perguntar("Seu nome (autor)"),
    }
    aviso = novo_aviso(entrada)
    aviso["id"] = dados.proximo_id(avisos)
    avisos.append(aviso)
    print(f"Aviso {aviso['id']} registrado. Aguardando dupla checagem.")


def listar(avisos):
    if not avisos:
        print("\nNenhum aviso registrado.")
    for a in avisos:
        situacao = f"checado por {a['checador']}" if a["checador"] else "aguardando checagem"
        util = {True: "sim", False: "não"}[antecedencia_util(a)]
        print(f"\n[{a['id']}] {a['tipo']} - {a['onde']} - {situacao}"
              f"\n    {a['oque']} | linhas {a['linhas']} | até {a['fim']}"
              f"\n    fonte {a['fonte']} às {a['hora_fonte']} | antecedência útil na fonte: {util}"
              f"\n    no canal: {a['hora_canal'] or 'não publicado'}")


def fazer_checagem(avisos):
    pendentes = [a for a in avisos if not a["checador"]]
    if not pendentes:
        print("\nNenhum aviso aguardando checagem.")
        return
    listar(pendentes)
    escolhido = perguntar("\nNúmero do aviso a checar")
    aviso = next((a for a in pendentes if a["id"] == escolhido), None)
    if aviso is None:
        raise ErroAviso("Número: escolha um dos avisos listados acima.")
    checar(aviso, perguntar("Seu nome (checador)"))
    print(f"Aviso {aviso['id']} checado.")


def gerar_boletim(avisos):
    data = perguntar("Data do boletim (DD/MM/AAAA, vazio = hoje)") or datetime.now().strftime("%d/%m/%Y")
    hora = HORARIOS[0] if perguntar("Horário: 1 = 6h30, 2 = 16h30") != "2" else HORARIOS[1]
    momento = ler_data(f"{data} {hora}", "Data do boletim")
    texto, incluidos = montar_boletim(avisos, momento)
    print("\n" + "-" * 50 + "\n" + texto + "\n" + "-" * 50)
    if perguntar("Marcar como publicado no canal? (s/n)").lower() == "s":
        publicar(incluidos, momento)
        print(f"Horário no canal registrado: {momento.strftime(FORMATO)}.")


def main():
    avisos = dados.carregar(ARQUIVO)
    acoes = {"1": registrar, "2": fazer_checagem, "3": listar, "4": gerar_boletim,
             "5": lambda av: print("\n" + relatorio(av))}
    while True:
        print(f"\nCONDE AVISA v0.1 - planilha: {ARQUIVO}"
              "\n1 Registrar aviso\n2 Dupla checagem\n3 Listar avisos"
              "\n4 Gerar boletim\n5 Relatório de antecedência\n0 Sair")
        opcao = perguntar("Opção")
        if opcao == "0":
            break
        if opcao not in acoes:
            print("Opção inválida. Digite um número de 0 a 5.")
            continue
        try:
            acoes[opcao](avisos)
            dados.salvar(ARQUIVO, avisos)
        except ErroAviso as erro:
            print(f"Não foi possível concluir. {erro} Nada foi alterado.")


if __name__ == "__main__":
    try:
        main()
    except (EOFError, KeyboardInterrupt):
        print("\nEncerrado.")
