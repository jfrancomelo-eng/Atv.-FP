"""Registro em planilha CSV (abre no Excel ou Google Planilhas)."""
import csv
import os

from .regras import CAMPOS


def carregar(caminho):
    if not os.path.exists(caminho):
        return []
    with open(caminho, newline="", encoding="utf-8") as f:
        return [{c: linha.get(c, "") or "" for c in CAMPOS} for linha in csv.DictReader(f)]


def salvar(caminho, avisos):
    with open(caminho, "w", newline="", encoding="utf-8") as f:
        escritor = csv.DictWriter(f, fieldnames=CAMPOS)
        escritor.writeheader()
        escritor.writerows(avisos)


def proximo_id(avisos):
    return str(max((int(a["id"]) for a in avisos), default=0) + 1)
