import { useMemo, useState } from 'react';
import { Fingerprint, PenLine, ShieldCheck, ShieldX, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { SuiteHero, CopyBox, Tilt, Faq } from './SovereignKit';
import { generateNostrKeys, nostrKeysFromSecret, decodeNostr, signNostrEvent, verifyNostrEvent, encodeNostr, type NostrEvent } from '@/components/tools/lib/sovereign-math';

type Keys = ReturnType<typeof generateNostrKeys>;

export default function ForjaNostr() {
  const [keys, setKeys] = useState<Keys | null>(null);
  const [show, setShow] = useState(false);
  const [importValue, setImportValue] = useState('');
  const [importError, setImportError] = useState('');
  const [content, setContent] = useState('Pensar ainda é permitido. Agir também.');
  const [event, setEvent] = useState<NostrEvent | null>(null);
  const [tampered, setTampered] = useState(false);

  const glyph = useMemo(() => keys ? Array.from({ length: 64 }, (_, i) => parseInt(keys.pubHex[i % 64] ?? '0', 16) > 7) : [], [keys]);
  const shown = event ? (tampered ? { ...event, content: event.content + ' ' } : event) : null;
  const valid = shown ? verifyNostrEvent(shown) : false;

  const forge = () => { setKeys(generateNostrKeys()); setEvent(null); setShow(false); setImportError(''); };
  const doImport = () => {
    try {
      const v = importValue.trim();
      const hex = v.startsWith('nsec') ? decodeNostr(v).hex : v;
      if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error();
      setKeys(nostrKeysFromSecret(hex.toLowerCase())); setEvent(null); setImportError(''); setImportValue('');
    } catch { setImportError('Chave inválida. Use nsec1… ou 64 caracteres hexadecimais.'); }
  };

  return <div className="ss-root">
    <SuiteHero kicker="Identidade sem dono · protocolo Nostr" title="Forja de" accent="Identidade" repo="https://github.com/nostr-dev-kit/ndk" repoLabel="NDK (NOSTR DEV KIT)"
      lead="No Nostr não existe conta para ser banida. Sua identidade é um par de chaves que nasce aqui, no seu aparelho. Quem tem a chave privada fala por você. Quem tem a pública só consegue confirmar que foi você." />
    <div className="ss-wrap">
      <div className="ss-grid">
        <section className="ss-plate">
          <span className="ss-tag">01 · FORJA</span>
          <h2>Gerar chaves</h2>
          <p className="ss-sub">Curva secp256k1, a mesma do Bitcoin, com assinatura Schnorr. A aleatoriedade vem do sistema operacional.</p>
          <div className="ss-row"><button type="button" className="ss-btn" onClick={forge}><RefreshCw size={14} />{keys ? 'Forjar outra' : 'Forjar identidade'}</button></div>
          <label className="ss-label" htmlFor="nx-imp">Ou confira uma chave que você já tem</label>
          <input id="nx-imp" className="ss-input" type="password" autoComplete="off" placeholder="nsec1… (fica só nesta aba)" value={importValue} onChange={e => setImportValue(e.target.value)} />
          <div className="ss-row"><button type="button" className="ss-btn ghost" onClick={doImport} disabled={!importValue}>Derivar chave pública</button></div>
          {importError && <p className="ss-bad" role="alert" style={{ fontSize: 12, marginTop: 10 }}>{importError}</p>}
        </section>

        <Tilt max={6}>
          <section className="ss-idcard" aria-live="polite">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div><p className="ss-kicker"><Fingerprint size={14} />CARTÃO NOSTR</p>
                <h2 className="ss-title" style={{ fontSize: 44, margin: '14px 0' }}>{keys ? 'Identidade viva' : 'Aguardando forja'}</h2></div>
              <div className="ss-glyph ss-layer" style={{ ['--z' as string]: '40px' }} aria-hidden="true">{(glyph.length ? glyph : Array(64).fill(false)).map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</div>
            </div>
            {keys ? <div className="ss-layer" style={{ ['--z' as string]: '24px', display: 'grid', gap: 10 }}>
              <span className="ss-label" style={{ margin: 0 }}>Chave pública · pode divulgar</span>
              <CopyBox value={keys.npub} />
              <span className="ss-label" style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>Chave privada · nunca mostre
                <button type="button" className="ss-copy" style={{ position: 'static' }} onClick={() => setShow(s => !s)}>{show ? <EyeOff size={11} /> : <Eye size={11} />}</button></span>
              <CopyBox value={show ? keys.nsec : '•'.repeat(32)} dim label={show ? 'COPIAR' : '-'} />
            </div> : <p className="ss-sub">Aperte "Forjar identidade". Nada é enviado para servidor algum.</p>}
          </section>
        </Tilt>
      </div>

      {keys && <section className="ss-plate">
        <span className="ss-tag">02 · ASSINATURA</span>
        <h2><PenLine size={22} style={{ display: 'inline', marginRight: 10 }} />Assine uma mensagem</h2>
        <p className="ss-sub">Monta um evento NIP-01, calcula o identificador (SHA-256) e assina com Schnorr. Nada é publicado: você vê exatamente o que um cliente Nostr enviaria aos relays.</p>
        <textarea className="ss-input" value={content} onChange={e => setContent(e.target.value)} maxLength={500} aria-label="Mensagem" />
        <div className="ss-row">
          <button type="button" className="ss-btn" onClick={() => { setEvent(signNostrEvent(keys.secretHex, content, Math.floor(Date.now() / 1000))); setTampered(false); }}>Assinar evento</button>
          {event && <button type="button" className={`ss-btn ${tampered ? 'ghost' : 'ember'}`} onClick={() => setTampered(t => !t)}>{tampered ? 'Restaurar original' : 'Adulterar 1 caractere'}</button>}
        </div>
        {shown && <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
          <p className={`ss-phase ${valid ? 'ss-ok' : 'ss-bad'}`} aria-live="polite">{valid ? <ShieldCheck size={14} /> : <ShieldX size={14} />}{valid ? 'Assinatura válida · autoria comprovada' : 'Assinatura inválida · conteúdo foi alterado'}</p>
          <CopyBox value={`ID ${encodeNostr('note', shown.id)}`} dim />
          <CopyBox value={JSON.stringify(shown, null, 1)} dim />
        </div>}
      </section>}

      <div className="ss-warn">Quem tiver a sua nsec é você para o mundo, e não existe "esqueci a senha". Guarde-a como guarda as palavras da sua carteira e use, de preferência, uma extensão assinadora (NIP-07) ou um aparelho dedicado em vez de colar a chave em aplicativos.</div>

      <Faq items={[
        { q: 'Isso cria uma conta?', a: 'Não existe conta. O par de chaves é a identidade. Qualquer cliente Nostr (Damus, Amethyst, Primal, Snort) aceita a mesma chave.' },
        { q: 'O que é npub e nsec?', a: 'São as mesmas chaves em formato legível (bech32, NIP-19). npub é a pública, para compartilhar. nsec é a privada, para assinar.' },
        { q: 'Por que a adulteração quebra a assinatura?', a: 'O identificador é o SHA-256 do evento inteiro. Mudar um único espaço gera outro identificador, e a assinatura antiga deixa de bater.' },
        { q: 'Posso usar a mesma chave do Bitcoin?', a: 'Tecnicamente a curva é a mesma, mas não faça isso. Separe identidades: uma chave para falar, outra para guardar valor.' },
      ]} />
    </div>
  </div>;
}
