// Busca o arquivo gerado com a data do último commit e atualiza o elemento #lastUpdated
(function(){
    const el = document.getElementById('lastUpdated');
    if(!el) return;

    function formatDate(iso){
        try{
            const d = new Date(iso);
            return new Intl.DateTimeFormat('pt-BR', {dateStyle:'medium', timeStyle:'short'}).format(d);
        }catch(e){
            return iso;
        }
    }

    fetch('js/last_commit.json', {cache: 'no-store'})
        .then(r => {
            if(!r.ok) throw new Error('no-file');
            return r.json();
        })
        .then(j => {
            if(j && j.date){
                el.textContent = formatDate(j.date);
                el.title = j.commit ? `Commit ${j.commit}` : '';
            } else {
                el.textContent = 'indisponível';
            }
        })
        .catch(()=>{
            el.textContent = 'indisponível';
        });
})();
