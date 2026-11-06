/* Roteador da esteira pós-compra, versão CAKTO (05/11/2026). Páginas em /c/<etapa>/.
   A Cakto manda o comprador para a página de upsell com ?upsellToken=... na URL. O script da Cakto (upsell.js) lê os atributos
   upsell-accept-url (ACEITAR) e upsell-reject-url (RECUSAR) dos botões e acrescenta o upsellToken sozinho ao redirecionar;
   "members_area" = área de membros da Cakto. Aqui só definimos para onde cada botão leva, com a mesma ordem da versão Kiwify:
   pergunta "onde mais incomoda" -> a área escolhida primeiro -> o resto na ordem padrão; recusou o upsell -> o downsell dele. */
(function () {
  var ORDEM = ['u01', 'u02', 'u03', 'u04', 'u05', 'u06', 'u07', 'u08', 'u09', 'u10'];
  var BASE = location.origin + '/c/';
  var ATIVOS = window.M8_ATIVOS || null;
  var ativo = function (p) { return !ATIVOS || ATIVOS.indexOf(p) >= 0; };
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var ordem = function () { try { var o = JSON.parse(ls.get('m8c_ordem') || 'null'); if (o && o.length === ORDEM.length) return o; } catch (e) {} return ORDEM.slice(); };
  var proximo = function (u) { var o = ordem(), i = o.indexOf(u); for (var k = i + 1; i >= 0 && k < o.length; k++) if (ativo(o[k])) return o[k]; return null; };
  var url = function (p) { return p ? BASE + p + '/' : 'members_area'; };
  var ev = function (n) { try { window.clarity && window.clarity('event', 'ck_' + n); } catch (e) {} };

  [].forEach.call(document.querySelectorAll('.sair a'), function (a) { a.addEventListener('click', function () { ev('saiu_' + (document.body.getAttribute('data-passo') || '')); }); });

  var passo = document.body.getAttribute('data-passo');
  var aceitar = document.querySelector('cakto-upsell-accept'), recusar = document.querySelector('cakto-upsell-reject');
  if (passo && aceitar) {
    var up = passo.charAt(0) === 'u', base = up ? passo : 'u' + passo.slice(1);
    var depois = base === 'u01' ? 'pergunta' : proximo(base);
    var seRecusar = up && ativo('d' + passo.slice(1)) ? url('d' + passo.slice(1)) : url(depois);
    aceitar.setAttribute('upsell-accept-url', url(depois));
    aceitar.setAttribute('upsell-reject-url', seRecusar);
    if (recusar) recusar.setAttribute('upsell-reject-url', seRecusar);
    aceitar.addEventListener('click', function () { ev(passo + '_aceitou'); }, true);
    if (recusar) recusar.addEventListener('click', function () { ev(passo + '_recusou'); }, true);
    [].forEach.call(document.querySelectorAll('.recusar-link'), function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); var b = recusar && recusar.shadowRoot && recusar.shadowRoot.querySelector('button'); if (b) b.click(); else if (recusar) recusar.click(); });
    });
  }

  // página da pergunta: a área escolhida vem primeiro, o resto segue a ordem padrão (mantém o upsellToken da URL)
  [].forEach.call(document.querySelectorAll('.perg [data-u]'), function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-u');
      if (u !== 'pular') { ls.set('m8c_ordem', JSON.stringify(['u01', u].concat(ORDEM.filter(function (x) { return x !== 'u01' && x !== u; })))); ev('pergunta_' + u); }
      else { ls.set('m8c_ordem', JSON.stringify(ORDEM)); ev('pergunta_pulou'); }
      var alvo = u === 'pular' ? proximo('u01') : (ativo(u) ? u : proximo('u01'));
      location.href = (alvo ? BASE + alvo + '/' : 'https://app.cakto.com.br/auth/login/') + location.search;
    });
  });
})();
