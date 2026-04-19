# Padronização de Modais de Aviso e Erro

## Visão Geral

A partir de agora, **não devem mais ser usados** `alert()`, `confirm()` ou `prompt()` nativos do navegador em nenhum ponto da aplicação.

Todos os alertas nativos foram substituídos por modais customizados do sistema, com padrão visual consistente, melhor usabilidade e alinhamento com a identidade da aplicação.

## Componentes Disponíveis

### 1. Dialog (Componente Principal)

Componente unificado para todos os tipos de modais:

```tsx
import { Dialog } from './components/ui/Dialog';

<Dialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Excluir movimentação"
  message="Deseja realmente excluir esta movimentação? Essa ação não poderá ser desfeita."
  confirmLabel="Excluir"
  cancelLabel="Cancelar"
  variant="danger"
/>
```

#### Variantes Suportadas

| Variante   | Uso                                    | Ícone    | Cor       |
|------------|----------------------------------------|----------|-----------|
| `danger`   | Exclusões, ações destrutivas           | ❌        | Vermelho  |
| `error`    | Erros de operação, falhas              | ❌        | Vermelho  |
| `warning`  | Avisos importantes, atenção necessária | ⚠️        | Amarelo   |
| `primary`  | Confirmações gerais                    | ℹ️        | Azul      |
| `success`  | Confirmações de sucesso                | ✅        | Verde     |
| `info`     | Informações, orientações               | ℹ️        | Azul      |

### 2. Hooks Especializados

#### useDialog (Hook Base)

```tsx
import { useDialog } from './hooks/useDialog';

const { isOpen, open, close, onConfirm, onClose, options } = useDialog(
  {
    title: 'Título',
    message: 'Mensagem',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    variant: 'primary',
  },
  handleConfirm // callback opcional
);
```

#### useConfirmationDialog

Para confirmações genéricas:

```tsx
const { isOpen, open, close, onConfirm, onClose } = useConfirmationDialog(
  'Confirmar ação',
  'Tem certeza que deseja continuar?',
  handleConfirm,
  { variant: 'primary' }
);
```

#### useDeleteDialog

Específico para exclusões (já configurado com variante danger):

```tsx
const { isOpen, open, close, onConfirm, onClose } = useDeleteDialog(
  'esta movimentação',
  handleDelete
);

// Uso no JSX:
<Dialog
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={onConfirm}
  {...options}
/>
```

#### useErrorDialog

Para exibição de erros (sem botão de cancelar):

```tsx
const { isOpen, open, close, onConfirm, onClose } = useErrorDialog(
  'Não foi possível concluir a ação',
  'Ocorreu um erro ao excluir a movimentação. Tente novamente.',
  () => console.log('Fechou o modal')
);
```

#### useSuccessDialog

Para mensagens de sucesso:

```tsx
const { isOpen, open, close, onConfirm, onClose } = useSuccessDialog(
  'Movimentação excluída',
  'A movimentação foi removida com sucesso.'
);
```

#### useWarningDialog

Para avisos importantes:

```tsx
const { isOpen, open, close, onConfirm, onClose } = useWarningDialog(
  'Atenção',
  'Esta ação afetará todos os usuários do sistema.'
);
```

### 3. Toast (Notificações Rápidas)

Para mensagens rápidas que não requerem interação:

```tsx
import { useToast } from './components/ui/Toast';

const { success, error, warning, info } = useToast();

// Uso:
success('Operação realizada com sucesso!');
error('Erro ao conectar com o servidor.');
warning('Campos obrigatórios pendentes.');
info('Nova atualização disponível.');
```

## Padrões de Texto

### ✅ Textos Recomendados

**Confirmação de Exclusão:**
- Título: `Excluir [item]`
- Mensagem: `Deseja realmente excluir [item]? Essa ação não poderá ser desfeita.`
- Botão confirmar: `Excluir`
- Botão cancelar: `Cancelar`

**Erro:**
- Título: `Não foi possível concluir a ação`
- Mensagem: `Ocorreu um erro ao [ação]. Tente novamente.`
- Botão: `Fechar`

**Sucesso:**
- Título: `[Item] [ação concluída]`
- Mensagem: `[Descrição específica do resultado]`
- Botão: `OK`

**Aviso:**
- Título: `Atenção`
- Mensagem: `[Orientação clara e específica]`
- Botão: `Entendi`

### ❌ Textos a Evitar

- "Tem certeza?"
- "Erro"
- "Aviso"
- "OK" (como único texto)
- Mensagens genéricas sem contexto

## Regras de UX/UI

### Todos os modais devem seguir:

1. **Visual compatível** com o design system da aplicação
2. **Título claro e objetivo**
3. **Mensagem curta, direta e compreensível**
4. **Botões com textos padronizados**
5. **Destaque visual conforme tipo** (cores e ícones)
6. **Fechamento controlado** (overlay, ESC, clique fora)
7. **Responsivo** para desktop e mobile
8. **Acessível via teclado** quando possível

### Comportamento Esperado

| Situação                      | Componente Recomendado |
|-------------------------------|------------------------|
| Ações destrutivas             | `Dialog` + `useDeleteDialog` |
| Erros de operação             | `Dialog` + `useErrorDialog` ou `Toast.error` |
| Sucessos simples              | `Toast.success` |
| Confirmações importantes      | `Dialog` + `useConfirmationDialog` |
| Orientações ao usuário        | `Dialog` + `useWarningDialog` |
| Notificações rápidas          | `Toast` |

## Exemplo Completo

```tsx
import { useState } from 'react';
import { Button } from './components/ui/Button';
import { Dialog } from './components/ui/Dialog';
import { useToast } from './components/ui/Toast';
import { useDeleteDialog } from './hooks/useDialog';

export function MinhaPagina() {
  const { success, error } = useToast();
  
  const { 
    isOpen: deleteDialogOpen, 
    open: openDeleteDialog, 
    close: closeDeleteDialog,
    onConfirm: onConfirmDelete,
    onClose: onCloseDelete
  } = useDeleteDialog('este item', async () => {
    await api.delete('/item/123');
    success('Item excluído com sucesso!');
  });

  const handleDelete = () => {
    openDeleteDialog();
  };

  return (
    <>
      <Button variant="danger" onClick={handleDelete}>
        Excluir Item
      </Button>

      <Dialog
        isOpen={deleteDialogOpen}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        {...{
          title: 'Excluir este item',
          message: 'Deseja realmente excluir este item? Essa ação não poderá ser desfeita.',
          confirmLabel: 'Excluir',
          cancelLabel: 'Cancelar',
          variant: 'danger' as const
        }}
      />
    </>
  );
}
```

## Critérios de Aceite

✅ Não há mais `alert`, `confirm` ou `prompt` nativos na aplicação  
✅ Todos os avisos e erros estão usando o componente padrão  
✅ Os modais estão visualmente consistentes entre todas as telas  
✅ Ações críticas estão com confirmação adequada  
✅ Textos são específicos e informativos  
✅ Componentes são reutilizáveis e centralizados  

## Arquivos Criados/Modificados

- `/frontend/src/components/ui/Dialog.tsx` - Componente unificado de diálogo
- `/frontend/src/components/ui/Dialog.module.css` - Estilos do Dialog
- `/frontend/src/hooks/useDialog.ts` - Hooks especializados
- `/frontend/src/hooks/index.ts` - Exportação dos hooks
- `/frontend/src/components/ui/index.ts` - Exportação dos componentes UI
- `/frontend/src/components/ui/Button.tsx` - Adicionado suporte à variante `success`
- `/frontend/src/components/ui/Button.module.css` - Estilos da variante `success`
- `/frontend/src/pages/FluxoDiario.tsx` - Exemplo de migração (confirm → Dialog)

## Migração de Código Existente

### Antes (NÃO USAR MAIS):

```tsx
// ❌ Nativo do navegador
if (!confirm('Deseja excluir?')) return;
await deleteItem(id);
alert('Excluído!');
```

### Depois (PADRÃO ATUAL):

```tsx
// ✅ Usando Dialog
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [itemToDelete, setItemToDelete] = useState<string | null>(null);

const handleDeleteClick = (id: string) => {
  setItemToDelete(id);
  setDeleteDialogOpen(true);
};

const confirmDelete = async () => {
  if (!itemToDelete) return;
  try {
    await deleteItem(itemToDelete);
    success('Item excluído com sucesso!');
  } catch {
    error('Erro ao excluir o item.');
  } finally {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  }
};

return (
  <>
    <Button onClick={() => handleDeleteClick(id)}>Excluir</Button>
    
    <Dialog
      isOpen={deleteDialogOpen}
      onClose={() => setDeleteDialogOpen(false)}
      onConfirm={confirmDelete}
      title="Excluir item"
      message="Deseja realmente excluir este item? Essa ação não poderá ser desfeita."
      confirmLabel="Excluir"
      variant="danger"
    />
  </>
);
```
