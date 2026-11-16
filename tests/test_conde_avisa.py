"""Critérios de aceitação (CA01-CA14 do README) em forma de teste.
Rodar na pasta do projeto:  python -m unittest -v
"""
import unittest
from datetime import datetime

from conde_avisa.boletim import RODAPE, SEM_MUDANCAS, montar_boletim, publicar, relatorio
from conde_avisa.regras import ErroAviso, antecedencia_util, atraso_minutos, checar, novo_aviso

MANHA = datetime(2026, 11, 25, 6, 30)


def entrada(**muda):
    dados = {
        "tipo": "desvio", "fonte": "CTTU",
        "oque": "Linhas desviadas pela Rua da Aurora por obra na via",
        "linhas": "040, 043", "onde": "Rua do Hospício",
        "inicio": "25/11/2026 08:00", "fim": "28/11/2026 18:00",
        "link": "https://exemplo.gov.br/aviso", "hora_fonte": "25/11/2026 05:50",
        "autor": "Arthur",
    }
    dados.update(muda)
    return dados


def checado(**muda):
    aviso = novo_aviso(entrada(**muda))
    checar(aviso, "Rafael")
    return aviso


class Registro(unittest.TestCase):
    def test_ca01_aviso_valido_aguarda_checagem(self):
        aviso = novo_aviso(entrada(fonte="cttu"))
        self.assertEqual(aviso["fonte"], "CTTU")
        self.assertEqual(aviso["checador"], "")

    def test_ca02_fonte_fora_da_lista(self):
        with self.assertRaisesRegex(ErroAviso, "Fonte"):
            novo_aviso(entrada(fonte="Grupo de bairro"))

    def test_ca03_parada_fora_do_trecho(self):
        with self.assertRaisesRegex(ErroAviso, "Onde"):
            novo_aviso(entrada(onde="Boa Viagem"))

    def test_ca04_fim_antes_do_inicio(self):
        with self.assertRaisesRegex(ErroAviso, "Até quando"):
            novo_aviso(entrada(fim="24/11/2026 18:00"))

    def test_ca04_data_em_formato_errado(self):
        with self.assertRaisesRegex(ErroAviso, "DD/MM/AAAA"):
            novo_aviso(entrada(inicio="2026-11-25"))

    def test_ca05_texto_longo(self):
        with self.assertRaisesRegex(ErroAviso, "100 caracteres"):
            novo_aviso(entrada(oque="x" * 101))

    def test_ca06_chuva_sem_linhas_vale_para_todas(self):
        aviso = novo_aviso(entrada(tipo="chuva forte", fonte="APAC", linhas="", onde="Todo o trecho"))
        self.assertEqual(aviso["linhas"], "todas")

    def test_ca06_desvio_sem_linhas_recusado(self):
        with self.assertRaisesRegex(ErroAviso, "Linhas"):
            novo_aviso(entrada(linhas=""))


class Checagem(unittest.TestCase):
    def test_ca07_autor_nao_checa_o_proprio_aviso(self):
        aviso = novo_aviso(entrada())
        with self.assertRaisesRegex(ErroAviso, "outra pessoa"):
            checar(aviso, "arthur")
        self.assertEqual(aviso["checador"], "")
        checar(aviso, "Rafael")
        self.assertEqual(aviso["checador"], "Rafael")


class Boletim(unittest.TestCase):
    def test_ca08_sem_avisos_publica_sem_mudancas(self):
        texto, incluidos = montar_boletim([novo_aviso(entrada())], MANHA)  # não checado
        self.assertIn(SEM_MUDANCAS, texto)
        self.assertIn(RODAPE, texto)
        self.assertEqual(incluidos, [])

    def test_ca09_so_entram_avisos_checados_e_vigentes(self):
        ok = checado()
        vencido = checado(inicio="20/11/2026 08:00", fim="24/11/2026 18:00")
        texto, incluidos = montar_boletim([ok, novo_aviso(entrada()), vencido], MANHA)
        self.assertEqual(incluidos, [ok])
        # aviso que a fonte só publica depois do boletim ainda não entra
        futuro = checado(hora_fonte="25/11/2026 07:00")
        self.assertEqual(montar_boletim([futuro], MANHA)[1], [])
        for rotulo in ["Aviso 1 de 1: Desvio", "O quê:", "Linhas: 040, 043",
                       "Onde: Rua do Hospício", "Até quando: 28/11/2026 às 18h00",
                       "Fonte: CTTU, trânsito do Recife."]:
            self.assertIn(rotulo, texto)


class Antecedencia(unittest.TestCase):
    def test_ca10_limite_60_min_antes_do_pico(self):
        self.assertTrue(antecedencia_util(novo_aviso(entrada(hora_fonte="25/11/2026 05:50"))))
        self.assertTrue(antecedencia_util(novo_aviso(entrada(hora_fonte="25/11/2026 06:00"))))
        self.assertFalse(antecedencia_util(novo_aviso(entrada(hora_fonte="25/11/2026 06:01"))))

    def test_ca11_obra_ate_20h_da_vespera(self):
        obra = dict(tipo="obra", inicio="26/11/2026 07:00", fim="30/11/2026 18:00")
        self.assertTrue(antecedencia_util(novo_aviso(entrada(hora_fonte="25/11/2026 20:00", **obra))))
        self.assertFalse(antecedencia_util(novo_aviso(entrada(hora_fonte="25/11/2026 21:00", **obra))))

    def test_ca12_atraso_fonte_canal_e_boletim_das_6h30(self):
        aviso = checado()
        publicar([aviso], MANHA)
        self.assertEqual(aviso["hora_canal"], "25/11/2026 06:30")
        self.assertEqual(atraso_minutos(aviso), 40)
        self.assertTrue(antecedencia_util(aviso))                  # fonte a tempo
        self.assertFalse(antecedencia_util(aviso, "hora_canal"))   # canal tarde


class Relatorio(unittest.TestCase):
    def test_ca13_menos_de_10_eventos_inconclusivo(self):
        self.assertIn("Inconclusivo", relatorio([novo_aviso(entrada()) for _ in range(4)]))

    def test_ca14_percentual_e_leitura(self):
        a_tempo = [novo_aviso(entrada()) for _ in range(7)]
        tarde = [novo_aviso(entrada(hora_fonte="25/11/2026 07:30")) for _ in range(3)]
        texto = relatorio(a_tempo + tarde)
        self.assertIn("7 (70%)", texto)
        self.assertIn("Fonte publica a tempo", texto)
        texto = relatorio(a_tempo[:3] + [novo_aviso(entrada(hora_fonte="25/11/2026 07:30")) for _ in range(7)])
        self.assertIn("Cenário 2", texto)


if __name__ == "__main__":
    unittest.main()
