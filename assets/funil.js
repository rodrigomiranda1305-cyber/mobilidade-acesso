/* Roteador da esteira pós-compra (02/11/2026).
   A Kiwify manda o comprador para /u01/ com code_senha, token, amount e payment_type na URL. Em cada página, o script da Kiwify
   lê data-upsell-url (para onde ir ao ACEITAR) e data-downsell-url (ao RECUSAR) na hora do clique, e acrescenta o token sozinho.
   Ordem: u01 -> (recusou) d01 -> pergunta "onde mais incomoda" -> a área escolhida primeiro -> o resto na ordem padrão.
   Em cada upsell recusado aparece o downsell dele; aceitando ou recusando o downsell, segue para o próximo upsell.
   Depois do último, URL vazia = a Kiwify leva para a área de membros. */
(function () {
  var ORDEM = ['u01', 'u02', 'u03', 'u04', 'u05', 'u06', 'u07', 'u08', 'u09', 'u10'];
  var BASE = location.origin + location.pathname.replace(/[^\/]+\/(index\.html)?$/, '');
  var ATIVOS = window.M8_ATIVOS || null;   // assets/passos.js: etapas que existem (as que faltam são puladas)
  var ativo = function (p) { return !ATIVOS || ATIVOS.indexOf(p) >= 0; };
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var qs = function (k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null; };
  var ordem = function () { try { var o = JSON.parse(ls.get('m8_ordem') || 'null'); if (o && o.length === ORDEM.length) return o; } catch (e) {} return ORDEM.slice(); };
  var proximo = function (u) { var o = ordem(), i = o.indexOf(u); for (var k = i + 1; i >= 0 && k < o.length; k++) if (ativo(o[k])) return o[k]; return null; };
  var url = function (p) { return p ? BASE + p + '/' : ''; };
  var ev = function (n) { try { window.clarity && window.clarity('event', n); } catch (e) {} };
  window.M8 = { ORDEM: ORDEM, BASE: BASE, qs: qs, ordem: ordem, ls: ls, ev: ev };

  if (qs('payment_type') === 'pix') document.documentElement.classList.add('pix');
  var cs = qs('code_senha');
  [].forEach.call(document.querySelectorAll('.sair a'), function (a) {
    a.href = cs ? 'https://dashboard.kiwify.com.br/student/password/' + cs : 'https://dashboard.kiwify.com.br/login';
    a.addEventListener('click', function () { ev('saiu_' + (document.body.getAttribute('data-passo') || '')); });
  });

  var passo = document.body.getAttribute('data-passo');
  var caixa = document.querySelector('[id^=kiwify-upsell-]:not([id*=trigger])');
  if (passo && caixa) {
    var up = passo.charAt(0) === 'u', base = up ? passo : 'u' + passo.slice(1);
    var depois = base === 'u01' ? 'pergunta' : proximo(base);
    caixa.setAttribute('data-upsell-url', url(depois));
    caixa.setAttribute('data-downsell-url', up && ativo('d' + passo.slice(1)) ? url('d' + passo.slice(1)) : url(depois));
    document.addEventListener('click', function (e) {
      if (e.target.closest('[id^=kiwify-upsell-trigger-]')) ev(passo + '_aceitou');
      if (e.target.closest('[id^=kiwify-upsell-cancel-trigger-]')) ev(passo + '_recusou');
    }, true);
  }

  // página da pergunta: a área escolhida vem primeiro, o resto segue a ordem padrão
  [].forEach.call(document.querySelectorAll('.perg [data-u]'), function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-u');
      if (u !== 'pular') {
        var o = ['u01', u].concat(ORDEM.filter(function (x) { return x !== 'u01' && x !== u; }));
        ls.set('m8_ordem', JSON.stringify(o)); ev('pergunta_' + u);
      } else { ls.set('m8_ordem', JSON.stringify(ORDEM)); ev('pergunta_pulou'); }
      location.href = url(u === 'pular' ? proximo('u01') : (ativo(u) ? u : proximo('u01'))) + location.search;
    });
  });
})();
