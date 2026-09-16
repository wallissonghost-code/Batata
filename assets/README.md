# ROUND NOT — Assets

Estrutura oficial dos assets do jogo.

- `map/` — cenário/mapa da arena.
- `doll/` — frames da boneca: costas, giro e frente.
- `guards/` — sprites transparentes dos guardas.
- `players/p1` até `players/p4` — variantes visuais dos jogadores.

O número do jogador e o `@user` são renderizados dinamicamente pelo Canvas e não devem ser gravados nos sprites.

## Arquivos esperados

### doll
`back.png`, `turn-01.png`, `turn-02.png`, `front.png`

### guards
`circle.png`, `triangle.png`, `square.png`

### players/p1..p4
`idle.png`, `walk-01.png`, `walk-02.png`, `walk-03.png`, `walk-04.png`

O mapa atualmente enviado à raiz (`FB798BF0-2248-4F8C-9F80-D88DDD6B05C0.png`) é tratado pelo manifesto como o asset de mapa até a migração física do binário.