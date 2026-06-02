# pp-dashboard

## para rodar localmente execute o comando: 
python3 -m http.server 

## abra no navegador:
http://127.0.0.1:8000/ 

## Atualizar data do dashboard a partir do último commit

Para gerar o arquivo usado pelo front-end com a data do último commit, execute:

```
./scripts/update_last_commit.sh
```

Esse script escreve `js/last_commit.json` com o campo `date` usado pelo dashboard.