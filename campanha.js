// ==========================================================
// SEÇÃO CAMPANHA (página inicial) · Syncrypta 4.9
// Os dois botões abaixo do celular trocam o vídeo que aparece no player.
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('campanhaVideo')
    if (!video) return
    document.querySelectorAll('.campanha-abas button').forEach((aba) => {
        aba.addEventListener('click', () => {
            document.querySelectorAll('.campanha-abas button').forEach((outra) => { outra.classList.toggle('ativa', outra === aba); outra.setAttribute('aria-selected', String(outra === aba)) })
            video.pause()
            video.poster = aba.dataset.poster
            video.querySelector('source').src = aba.dataset.video
            video.load()
        })
    })
})
