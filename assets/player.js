/* Player próprio dos upsells (02/11/2026), no estilo dos players de VSL: começa sozinho sem som com o aviso
   "clique para ouvir", sem barra de controles, barra de progresso que anda mais rápido no começo,
   continua de onde parou e mostra o botão de compra no segundo certo (data-cta).
   Uso: <div class="vp" data-src="../v/u02.mp4" data-poster="../v/u02.jpg" data-cta="95" data-id="u02"></div>
        <div class="cta-bloco" id="cta"> ... </div>   (fica escondido até o segundo data-cta) */
(function () {
  var el = document.querySelector('.vp'); if (!el) return;
  var id = el.getAttribute('data-id') || 'v', cta = parseFloat(el.getAttribute('data-cta') || '0');
  var bloco = document.getElementById('cta');
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var ev = function (n) { try { window.clarity && window.clarity('event', id + '_' + n); } catch (e) {} };
  var mostrar = function (origem) {
    if (!bloco || bloco.classList.contains('ver')) return;
    bloco.classList.add('ver'); ls.set('m8cta_' + id, '1'); ev('botao_' + origem);
  };
  if (ls.get('m8cta_' + id)) mostrar('volta');

  el.innerHTML = '<video playsinline webkit-playsinline preload="auto" muted autoplay poster="' + el.getAttribute('data-poster') + '" src="' + el.getAttribute('data-src') + '"></video>' +
    '<div class="vp-som"><span class="vp-ico">🔊</span><b>Seu vídeo já começou</b><span>Toque para ouvir</span></div>' +
    '<div class="vp-play"><span></span></div><div class="vp-cont"><b>Você já começou a assistir</b><button data-a="c">Continuar de onde parei</button><button data-a="i">Assistir do início</button></div>' +
    '<div class="vp-barra"><i></i></div>';
  var v = el.querySelector('video'), som = el.querySelector('.vp-som'), play = el.querySelector('.vp-play'), cont = el.querySelector('.vp-cont'), barra = el.querySelector('.vp-barra i');
  var comSom = false, marcas = {};
  var salvo = parseFloat(ls.get('m8t_' + id) || '0');

  var estado = function (s) { el.setAttribute('data-estado', s); };
  estado('mudo');
  var tenta = v.play(); if (tenta && tenta.catch) tenta.catch(function () { estado('parado'); });

  var ativarSom = function (desde) {
    comSom = true; v.muted = false; v.currentTime = desde || 0; v.play(); estado('tocando'); ev('som');
  };
  som.addEventListener('click', function (e) {
    e.stopPropagation();
    if (salvo > 8 && salvo < (v.duration || 1e9) - 5) { v.pause(); estado('continuar'); return; }
    ativarSom(0);
  });
  cont.addEventListener('click', function (e) {
    var a = e.target.getAttribute('data-a'); if (!a) return; e.stopPropagation();
    ativarSom(a === 'c' ? salvo : 0);
  });
  el.addEventListener('click', function () {
    var s = el.getAttribute('data-estado');
    if (s === 'mudo') return ativarSom(0);
    if (s === 'parado') { if (!comSom) return ativarSom(0); v.play(); estado('tocando'); return; }
    if (s === 'tocando') { v.pause(); estado('parado'); }
  });
  v.addEventListener('timeupdate', function () {
    var d = v.duration || 1, t = v.currentTime, p = Math.pow(Math.min(t / d, 1), 0.55);
    barra.style.width = (p * 100).toFixed(1) + '%';
    if (comSom) {
      ls.set('m8t_' + id, String(t));
      [25, 50, 75].forEach(function (q) { if (!marcas[q] && t / d >= q / 100) { marcas[q] = 1; ev('assistiu' + q); } });
    }
    if (cta && t >= cta) mostrar('video');
  });
  v.addEventListener('ended', function () { mostrar('fim'); estado('parado'); if (comSom) ev('assistiu100'); ls.set('m8t_' + id, '0'); });
  v.addEventListener('error', function () { mostrar('erro'); });
  // quem não consegue dar o play (modo economia, internet fraca) não fica sem o botão
  setTimeout(function () { if (v.currentTime < 1) mostrar('sem_play'); }, 25000);
})();
