# Fotos de produto — formato e como chegam ao banco

Guia para quem cadastra peças no painel (`/admin/produtos`).

## Formato recomendado

| Item | Recomendado | Aceito (limite) |
|---|---|---|
| Formato | **JPEG** (foto de celular) ou **WebP** | JPEG, PNG, WebP, AVIF. **SVG, HEIC e GIF não** |
| Proporção | **Quadrada 1:1** (a loja mostra as fotos em quadrado) | Qualquer uma (é cortada no centro na vitrine) |
| Tamanho | **1200 × 1200 px** | Menor lado com **no mínimo 400 px** |
| Peso do arquivo | 300 KB a 2 MB | Até **8 MB** por foto |
| Quantidade | 3 a 5 por peça | Até **8 por produto** |

### Como fotografar
- **Capa (1ª foto):** a peça inteira, centralizada, com fundo liso (chão claro, bancada ou papelão). Sem texto por cima.
- **Fotos 2 a 4:** detalhes que vendem: dentes da coroa e o estriado do pinhão, a marcação de medida (ex.: STD) e as soldas e dobras da gaiola.
- **Última:** embalagem ou lote (como no story das 10 coroas), se fizer sentido.
- Use a **foto original do celular**. Print de story sai pequeno (≈ 470 px), com legenda e ícones do Instagram por cima. É aceito, mas fica com qualidade baixa.
- iPhone: em *Ajustes → Câmera → Formatos*, escolha **"Mais Compatível"**. Assim as fotos saem em JPEG, porque HEIC não é aceito.
- Evite marca d'água grande: ela é cortada no quadrado da vitrine.

## Como enviar no painel
1. **Produto novo:** em *Produtos → Novo*, use o card **"Fotos do produto" → Adicionar fotos**. Escolha várias de uma vez. A **primeira vira a capa**. Ao clicar em **Publicar na loja**, o produto é criado e as fotos são enviadas logo em seguida. Depois disso, o painel abre a tela de edição para você conferir a galeria.
2. **Produto existente:** em *Produtos → (produto) → Galeria de imagens*, adicione as fotos e escreva uma descrição curta de cada uma (texto alternativo, mínimo 3 letras). Nessa tela você também troca a **principal** (estrela), reordena (setas ou arrastando) e remove (lixeira).

## O que acontece com cada foto (banco de dados)
1. O servidor confere o **conteúdo real** do arquivo, não a extensão. Também verifica o tamanho mínimo e o limite de 8 fotos.
2. O original é guardado e são geradas **4 versões WebP**:
   `thumb` 160 px (listas do painel) · `card` 480 px (vitrine) · `detail` 1000 px (página do produto) · `zoom` 1600 px.
   A foto nunca é ampliada: uma foto de 470 px continua com 470 px.
3. Registros criados:
   - **`MediaFile`**: o arquivo (nome original, tipo, peso, largura e altura, hash SHA-256 e as URLs das 4 versões). Se a mesma foto for enviada de novo, o arquivo já salvo é reaproveitado, sem duplicar.
   - **`ProductImage`**: o vínculo com o produto (`url` = versão *detail*, `alt`, `isPrimary`, `position`).
   - **`AuditLog`**: registra quem enviou ou removeu cada foto.
4. Remover uma foto apaga só o **vínculo**. O `MediaFile` fica guardado para auditoria e só é limpo depois de 30 dias sem uso.

### Onde os arquivos ficam
- **Desenvolvimento/demo:** na pasta `uploads/` do servidor (fora do git), servida por `/api/media/...`.
- **Produção:** se o site for para uma hospedagem *serverless* (ex.: Vercel), o disco é apagado a cada deploy. Antes de ir ao ar é preciso ligar um armazenamento externo (Supabase Storage ou S3) via `STORAGE_DRIVER` em `src/server/storage`.
