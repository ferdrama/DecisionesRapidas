# Máquina de estados

Diagrama de alto nivel para la sesión de decisión.

```mermaid
stateDiagram-v2
  [*] --> Idle

  Idle --> SpinningManual: click Decidir (modo manual)
  SpinningManual --> Decided: timeout + chooseFinalOption
  SpinningManual --> Idle: cancel implícito (no expuesto)

  Idle --> FetchingWeights: click Decidir (modo IA)
  FetchingWeights --> WeightsReady: response OK
  FetchingWeights --> Error: response/error
  WeightsReady --> Decided: pickWithWeights + render
  Error --> Idle: usuario reintenta o cambia modo

  Decided --> Idle: nuevo click Decidir
```

Notas:
- En modos manuales (`binary`, `dice`, listas IA OFF) existe el flag `spinning` para evitar reentrancia.
- En modos IA el botón se deshabilita durante `FetchingWeights`; no se usa `spinning` pero el efecto es equivalente.
- El estado `WeightsReady` solo vive durante el render de pesos; los pesos no se persisten.

Estados de UI auxiliares (modales):

```mermaid
stateDiagram-v2
  [*] --> AppClosed
  AppClosed --> ListModalOpen: + Nueva Lista / Editar
  ListModalOpen --> AppClosed: Guardar / Cancelar / click outside
  AppClosed --> HistoryModalOpen: Abrir Historial
  HistoryModalOpen --> AppClosed: Cerrar / click outside
```

